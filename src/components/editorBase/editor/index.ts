import { Disposable } from "modules/disposable";
import { Emitter } from "../emitter";
import { SaveData, SaveDataType } from "../saveData";
import { shouldMerge } from "../saveData/shouldMerge";
import { DeepArrayLike, DeepArrayLikeNotValue } from "../utils/types";
import { createValue, Value } from "../value";
import { getCollapsedCursorInlineTextAttributes } from "../value/getCollapsedCursorInlineTextAttributes";

export interface PluginArgumentMap {
  [key: string]: [any[], any];
}

export type PluginFunction<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes,
  ArgumentMap extends PluginArgumentMap,
  Arguments extends [any[], any]
> = (
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes,
    ArgumentMap
  >,
  next: (...overides: Arguments[0] | []) => Arguments[1] | void,
  ...args: Arguments[0]
) => Arguments[1] | void;

export type Plugin<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes,
  ArgumentMap extends PluginArgumentMap
> = {
  [K in keyof ArgumentMap]?: PluginFunction<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes,
    ArgumentMap,
    ArgumentMap[K]
  >;
};

export class Editor<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes,
  ArgumentMap extends PluginArgumentMap = {}
> implements Disposable
{
  private _disposed = false;
  private _revisions: Array<
    Value<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >
  >;
  private _revisionIndex = 0;
  private _focused = false;
  private _lastSaveData?: SaveData;
  private _collapsedCursorInlineTextAttributes: InlineTextAttributes;
  private _edit: null | {
    value: null | Value<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >;
    saveData?: SaveData;
  } = null;
  private _middlewares: {
    [K in keyof ArgumentMap]?: Array<
      PluginFunction<
        ContentBlockAttributes,
        VoidBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes,
        ArgumentMap,
        ArgumentMap[K]
      >
    >;
  } = {};
  private _onValueChange = new Emitter<void>();
  private _onFocusChange = new Emitter<void>();
  private _onCollapsedCursorInlineTextAttributesChange = new Emitter<void>();
  public onValueChange = this._onValueChange.subscribe;
  public onFocusChange = this._onFocusChange.subscribe;
  public onCollapsedCursorInlineTextAttributesChange =
    this._onCollapsedCursorInlineTextAttributesChange.subscribe;

  constructor(
    value: Value<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >,
    plugins: DeepArrayLike<
      Plugin<
        ContentBlockAttributes,
        VoidBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes,
        ArgumentMap
      >
    >
  ) {
    this._revisions = [value];
    this._collapsedCursorInlineTextAttributes =
      getCollapsedCursorInlineTextAttributes(value);

    this.addPlugin(plugins);
  }

  public dispose(): void {
    if (!this._disposed) {
      this._disposed = true;
      this._onValueChange.dispose();
      this._onFocusChange.dispose();
    }
  }

  public get value(): Value<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  > {
    return this._edit && this._edit.value
      ? this._edit.value
      : this._revisions[this._revisionIndex];
  }

  public get focused(): boolean {
    return this._focused;
  }

  public get collapsedCursorInlineTextAttributes(): InlineTextAttributes {
    return this._collapsedCursorInlineTextAttributes;
  }

  public set collapsedCursorInlineTextAttributes(
    attributes: InlineTextAttributes
  ) {
    if (
      !this.value.document.meta.areInlineTextAttributesEqual(
        this._collapsedCursorInlineTextAttributes,
        attributes
      )
    ) {
      this._collapsedCursorInlineTextAttributes = attributes;
      this._onCollapsedCursorInlineTextAttributesChange.emit();
    }
  }

  public addPlugin(
    plugin: DeepArrayLike<
      Plugin<
        ContentBlockAttributes,
        VoidBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes,
        ArgumentMap
      >
    >
  ): void {
    if (this._disposed) {
      return;
    }

    if (typeof plugin.length === "number") {
      for (let i = 0; i < plugin.length; i++) {
        this.addPlugin(
          (
            plugin as DeepArrayLikeNotValue<
              Plugin<
                ContentBlockAttributes,
                VoidBlockAttributes,
                InlineTextAttributes,
                InlineVoidAttributes,
                ArgumentMap
              >
            >
          )[i]
        );
      }
      return;
    }

    Object.keys(plugin).forEach((key) => {
      const middleware = this._middlewares[key];
      const func = (
        plugin as Plugin<
          ContentBlockAttributes,
          VoidBlockAttributes,
          InlineTextAttributes,
          InlineVoidAttributes,
          ArgumentMap
        >
      )[key];

      if (func) {
        if (middleware) {
          middleware.push(func);
        } else {
          this._middlewares[key] = [func];
        }
      }
    });
  }

  public run<K extends keyof ArgumentMap>(
    key: K,
    ...args: ArgumentMap[K][0]
  ): ArgumentMap[K][1] | void {
    if (this._disposed) {
      return;
    }

    if (!(key in this._middlewares)) {
      return;
    }

    const middleware: Array<
      PluginFunction<
        ContentBlockAttributes,
        VoidBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes,
        ArgumentMap,
        ArgumentMap[K]
      >
    > = this._middlewares[key]!;

    if (!middleware) {
      return;
    }

    let i = 0;

    const next = (
      ...overrides: ArgumentMap[K][0] | []
    ): ArgumentMap[K][1] | void => {
      if (i === middleware.length) {
        return;
      }

      const fn = middleware[i++];

      if (overrides.length) {
        args = overrides;
      }

      return fn(this, next, ...args);
    };

    return next();
  }

  public save(
    value: Value<
      ContentBlockAttributes,
      VoidBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    >,
    saveData?: SaveData
  ): void {
    if (this._disposed) {
      return;
    }

    if (this._edit) {
      this._edit.value = value;
      this._edit.saveData = saveData;
      this._collapsedCursorInlineTextAttributes =
        getCollapsedCursorInlineTextAttributes(value);
      return;
    }

    const isSelectionChange =
      saveData && saveData.type === SaveDataType.SetSelection;

    if (
      this._revisionIndex < this._revisions.length - 1 &&
      !isSelectionChange
    ) {
      this._revisions.splice(this._revisionIndex + 1);
    }

    if (isSelectionChange && this._revisions.length > 1) {
      value = createValue(
        value.selection,
        value.document,
        this.value._originalSelection
      );
    }

    const lastSaveData = this._lastSaveData;

    if (shouldMerge(lastSaveData, saveData)) {
      this._revisions[this._revisionIndex] = value;
    } else {
      this._revisions[this._revisionIndex] = createValue(
        this.value.selection,
        this.value.document
      );
      this._revisionIndex++;
      this._revisions.push(value);
    }

    this._lastSaveData = saveData;
    this._collapsedCursorInlineTextAttributes =
      getCollapsedCursorInlineTextAttributes(value);
    this._onValueChange.emit();
  }

  public edit(change: () => SaveData | void): SaveData | void {
    if (this._disposed) {
      return;
    }

    if (this._edit) {
      const saveData = change();
      if (saveData && this._edit.value) {
        this._edit.saveData = saveData;
      }
      return;
    }

    this._edit = { value: null };
    const saveData = change();
    const edit = this._edit;
    this._edit = null;

    if (edit.value) {
      this.save(edit.value, saveData || edit.saveData);
    }

    console.log(this.value);
    window._value = this.value;
  }

  public undo(): void {
    if (this._disposed) {
      return;
    }

    if (this._edit) {
      throw new Error("Cannot undo while in an edit");
    }

    if (this._revisionIndex > 0) {
      this._revisionIndex--;
      this._restoreOriginalSelection();
      this._lastSaveData = undefined;
      this._collapsedCursorInlineTextAttributes =
        getCollapsedCursorInlineTextAttributes(this.value);
      this._onValueChange.emit();
    }
  }

  public redo(): void {
    if (this._disposed) {
      return;
    }

    if (this._edit) {
      throw new Error("Cannot redo while in an edit");
    }

    if (this._revisionIndex < this._revisions.length - 1) {
      this._revisionIndex++;
      this._restoreOriginalSelection();
      this._lastSaveData = undefined;
      this._collapsedCursorInlineTextAttributes =
        getCollapsedCursorInlineTextAttributes(this.value);
      this._onValueChange.emit();
    }
  }

  public focus(): void {
    if (this._disposed) {
      return;
    }

    if (!this._focused) {
      this._focused = true;
      this._onFocusChange.emit();
    }
  }

  public blur(): void {
    if (this._disposed) {
      return;
    }

    if (this._focused) {
      this._focused = false;
      this._onFocusChange.emit();
    }
  }

  private _restoreOriginalSelection(): void {
    this._revisions[this._revisionIndex] = createValue(
      this.value._originalSelection,
      this.value.document
    );
  }
}
