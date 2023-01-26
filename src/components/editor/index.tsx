/**
 * @todo
 * empty block text node for composition
 * fix when holding character composition
 */

import cn from "classnames";
import { createDocument, Document } from "components/editorBase/document";
import { DocumentMeta } from "components/editorBase/document/meta";
import { Editor, Plugin } from "components/editorBase/editor";
import { changeBlockAttributesInSelection } from "components/editorBase/editor/changeBlockAttributesInSelection";
import { changeInlineAttributesInRange } from "components/editorBase/editor/changeInlineAttributesInRange";
import { changeSelectionInlineTextAttributes } from "components/editorBase/editor/changeSelectionInlineTextAttributes";
import {
  BlockNodeType,
  EmptyBlockNode,
  InlineNode,
  InlineNodeType,
  VoidBlockNode,
} from "components/editorBase/node";
import { createBlockNodeFromText } from "components/editorBase/node/createBlockNodeFromText";
import { getContentBlockNodeAtIndex } from "components/editorBase/node/getContentBlockNodeAtIndex";
import { PointType } from "components/editorBase/point";
import { arePointsEqual } from "components/editorBase/point/arePointsEqual";
import { getPointAtStartOfBlockNodeInDocument } from "components/editorBase/point/getPointAtStartOfBlockNode";
import { Range } from "components/editorBase/range";
import { createReactPlugin } from "components/editorBase/react/createReactPlugin";
import { ReactArgumentsMap } from "components/editorBase/react/ReactArgumentsMap";
import { createSelection } from "components/editorBase/selection";
import { isSelectionEmpty } from "components/editorBase/selection/isSelectionEmpty";
import {
  hasCommandModifier,
  hasControlKey,
  hasKeyCode,
  hasShiftKey,
  isBold,
  isItalic,
} from "components/editorBase/utils/shortcuts";
import { createValue, Value } from "components/editorBase/value";
import { Tooltip } from "components/tooltip";
import { omit } from "lodash-es";
import { CompositeDisposable } from "modules/disposable/CompositeDisposable";
import React from "react";
import { allPass } from "utils/allPass";
import { ifElse } from "utils/ifElse";
import { not } from "utils/not";
import classes from "./style.module.scss";

enum ContentBlockStyle {
  Title,
  Subtitle,
  CodeBlock,
  Quote,
  PullQuote,
  BulletList,
  NumberedList,
}

interface ContentBlockAttributes {
  style?: ContentBlockStyle;
}

const emptyContentBlockAttributes: ContentBlockAttributes = {};

interface VoidBlockAttributes {}

enum InlineTextFlag {
  None = 0,
  Bold = 1 << 0,
  Italic = 1 << 1,
  Underline = 1 << 2,
  Code = 1 << 3,
  Strikethrough = 1 << 4,
}

enum InlineTextScript {
  Superscript,
  Subscript,
}

interface InlineTextAttributes {
  flags?: number;
  script?: InlineTextScript;
}

const emptyInlineTextAttributes: InlineTextAttributes = {};

interface InlineVoidAttributes {}

const meta: DocumentMeta<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> = {
  areContentBlockAttributesEqual(a, b) {
    return a.style === b.style;
  },
  areInlineTextAttributesEqual(a, b) {
    return a.flags === b.flags && a.script === b.script;
  },
  areInlineVoidAttributesEqual() {
    return true;
  },
  areVoidBlockAttributesEqual() {
    return true;
  },
  createEmptyContentBlockAttributes() {
    return emptyContentBlockAttributes;
  },
  createEmptyInlineTextAttributes() {
    return emptyInlineTextAttributes;
  },
};

const initialDocument = createDocument<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  [
    createBlockNodeFromText(
      "",
      emptyContentBlockAttributes,
      emptyInlineTextAttributes
    ),
  ],
  meta
);

const initialValue = createValue(
  createSelection(
    getPointAtStartOfBlockNodeInDocument(initialDocument, 0),
    getPointAtStartOfBlockNodeInDocument(initialDocument, 0)
  ),
  initialDocument
);

type ReactPlugin<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> = Plugin<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes,
  ReactArgumentsMap<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
>;

function forEachSelectedTextNodeInRange<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  range: Range,
  onNode: (
    node:
      | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
      | VoidBlockNode<VoidBlockAttributes>
      | InlineNode<InlineTextAttributes, InlineVoidAttributes>,
    blockNodeIndex: number,
    inlineNodeIndex: number
  ) => boolean | void
): void {
  const { start, end } = range;

  for (let i = start.blockNodeIndex; i <= end.blockNodeIndex; i++) {
    const blockNode = document.blockNodes[i];

    if (blockNode.type !== BlockNodeType.Content) {
      onNode(blockNode, i, 0);
      continue;
    }

    let j: number;

    if (i === start.blockNodeIndex) {
      if (start.type === PointType.InNonContentBlockNode) {
        continue;
      }

      j =
        start.type === PointType.AtEndOfLine
          ? blockNode.content.length - 1
          : start.inlineNodeIndex;
    } else {
      j = 0;
    }

    let endIndex: number;

    if (i === end.blockNodeIndex && end.type !== PointType.AtEndOfLine) {
      if (end.type === PointType.InNonContentBlockNode) {
        continue;
      }

      if (
        end.type === PointType.AtStartOfVoidInlineNode ||
        end.textOffset === 0
      ) {
        endIndex = end.inlineNodeIndex - 1;

        if (arePointsEqual(start, end)) {
          if (end.inlineNodeIndex === 0) {
            endIndex = 0;
          } else {
            j = endIndex;
          }
        }
      } else {
        endIndex = end.inlineNodeIndex;
      }
    } else {
      endIndex = blockNode.content.length - 1;
    }

    for (; j <= endIndex; j++) {
      if (onNode(blockNode.content[j], i, j) === false) {
        return;
      }
    }
  }
}

function areAllSelectedNodesContainingFlag(
  value: Value<unknown, unknown, InlineTextAttributes, InlineVoidAttributes>,
  flag: InlineTextFlag
): boolean {
  let isAllSelected = true;

  forEachSelectedTextNodeInRange(value.document, value.selection, (node) => {
    if (node.type === InlineNodeType.Void || node.type === BlockNodeType.Void) {
      return;
    }

    const isSelected =
      node.type === BlockNodeType.Empty
        ? !!node.inlineAttributes.flags && node.inlineAttributes.flags & flag
        : !!node.attributes.flags && node.attributes.flags & flag;

    if (!isSelected) {
      isAllSelected = false;
      return false;
    }
  });

  return isAllSelected;
}

function areAllSelectedNodesOfScript(
  value: Value<unknown, unknown, InlineTextAttributes, InlineVoidAttributes>,
  script: InlineTextScript
): boolean {
  let isAllSelected = true;

  forEachSelectedTextNodeInRange(value.document, value.selection, (node) => {
    if (node.type === InlineNodeType.Void || node.type === BlockNodeType.Void) {
      return;
    }

    const isSelected =
      node.type === BlockNodeType.Empty
        ? node.inlineAttributes.script === script
        : node.attributes.script === script;

    if (!isSelected) {
      isAllSelected = false;
      return false;
    }
  });

  return isAllSelected;
}

function isFlagActive(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  flag: InlineTextFlag
): boolean {
  if (isSelectionEmpty(editor.value.selection)) {
    return !!(
      editor.collapsedCursorInlineTextAttributes.flags &&
      editor.collapsedCursorInlineTextAttributes.flags & flag
    );
  } else {
    return areAllSelectedNodesContainingFlag(editor.value, flag);
  }
}

function isScriptActive(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  script: InlineTextScript
): boolean {
  if (isSelectionEmpty(editor.value.selection)) {
    return editor.collapsedCursorInlineTextAttributes.script === script;
  } else {
    return areAllSelectedNodesOfScript(editor.value, script);
  }
}

function changeInlineTextAttributesInSelection<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  changeAttributes: (attributes: InlineTextAttributes) => InlineTextAttributes
): void {
  const { selection } = editor.value;

  if (isSelectionEmpty(selection)) {
    changeSelectionInlineTextAttributes(editor, changeAttributes);
  } else {
    changeInlineAttributesInRange(editor, selection, changeAttributes);
  }
}

function toggleInlineTextFlag(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  flag: InlineTextFlag
): void {
  const isActive = isFlagActive(editor, flag);

  changeInlineTextAttributesInSelection(editor, (attributes) => {
    const { flags } = attributes;

    if (isActive) {
      if (flags) {
        const newFlags = flags & ~flag;

        if (newFlags === InlineTextFlag.None) {
          return omit(attributes, "flags");
        }

        return { ...attributes, flags: newFlags };
      }

      return attributes;
    }

    if (flags) {
      const newFlags = flags | flag;

      if (flags === newFlags) {
        return attributes;
      }

      return { ...attributes, flags: newFlags };
    }

    return { ...attributes, flags: flag };
  });
}

function toggleInlineTextScript(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  script: InlineTextScript
): void {
  const isActive = isScriptActive(editor, script);

  changeInlineTextAttributesInSelection(editor, (attributes) => {
    if (isActive) {
      return omit(attributes, "script");
    }

    return { ...attributes, script };
  });
}

function isContentBlockStyleActive(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  style: ContentBlockStyle
): boolean {
  const { document, selection } = editor.value;
  const start = selection.start.blockNodeIndex;
  const end = selection.end.blockNodeIndex;
  let isAllVoid = true;

  for (let i = start; i <= end; i++) {
    const blockNode = document.blockNodes[i];

    if (blockNode.type !== BlockNodeType.Void) {
      isAllVoid = false;

      if (blockNode.attributes.style !== style) {
        return false;
      }
    }
  }

  return !isAllVoid;
}

function toggleContentBlockStyle(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  style: ContentBlockStyle
): void {
  const isActive = isContentBlockStyleActive(editor, style);

  changeBlockAttributesInSelection(editor, (attributes) => {
    if (isActive) {
      return omit(attributes, "style");
    }

    if (attributes.style === style) {
      return attributes;
    }

    return { ...attributes, style };
  });
}

function clearStyle(
  editor: Editor<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >
): void {
  changeBlockAttributesInSelection(editor, (attributes) => ({}));
}

function getActiveContentBlockStyleClass(
  attributes: ContentBlockAttributes,
  document: Document<
    ContentBlockAttributes,
    VoidBlockAttributes,
    InlineTextAttributes,
    InlineVoidAttributes
  >,
  blockNodeIndex: number
): string | undefined {
  switch (attributes.style) {
    case ContentBlockStyle.Title: {
      return cn(classes.title, classes.editorContentLine);
    }

    case ContentBlockStyle.Subtitle: {
      return cn(classes.subtitle, classes.editorContentLine);
    }

    case ContentBlockStyle.CodeBlock: {
      const nextNode = document.blockNodes[blockNodeIndex + 1];
      const isLast =
        !nextNode ||
        nextNode.type === BlockNodeType.Void ||
        nextNode.attributes.style !== ContentBlockStyle.CodeBlock;

      return cn(classes.codeblock, isLast && classes.lastCodeBlock);
    }

    case ContentBlockStyle.Quote: {
      return cn(classes.quote, classes.editorContentLine);
    }

    case ContentBlockStyle.PullQuote: {
      return cn(classes.pullquote, classes.editorContentLine);
    }

    case ContentBlockStyle.BulletList: {
      return cn(classes.note, classes.editorContentLine);
    }

    case ContentBlockStyle.NumberedList: {
      return cn(classes.list, classes.editorContentLine);
    }
  }
}

const U = 85;
const J = 74;
const X = 88;
const ONE = 49;
const TWO = 50;
const SEVEN = 55;
const EIGHT = 56;
const NINE = 57;
const FULLSTOP = 190;
const COMMA = 188;
const QUOTE = 222;
const BACKSLASH = 220;

const isUnderline = allPass([
  hasCommandModifier,
  not(hasShiftKey),
  hasKeyCode(U),
]);
const isInlineCode = allPass([
  hasCommandModifier,
  not(hasShiftKey),
  hasKeyCode(J),
]);
const isStrikethrough = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(X),
]);
const isSuperscript = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(FULLSTOP),
]);
const isSubscript = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(COMMA),
]);
const isTitle = allPass([hasCommandModifier, hasShiftKey, hasKeyCode(ONE)]);
const isSubtitle = allPass([hasCommandModifier, hasShiftKey, hasKeyCode(TWO)]);
const isCodeBlock = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(SEVEN),
]);
const isQuote = allPass([
  hasCommandModifier,
  not(hasShiftKey),
  hasKeyCode(QUOTE),
]);
const isPullQuote = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(QUOTE),
]);
const isBulletList = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(EIGHT),
]);
const isNumberedList = allPass([
  hasCommandModifier,
  hasShiftKey,
  hasKeyCode(NINE),
]);
const isClearFormatting = allPass([hasCommandModifier, hasKeyCode(BACKSLASH)]);

const richPlugin: ReactPlugin<
  ContentBlockAttributes,
  VoidBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
> = {
  onKeyDown(editor, next, event) {
    if (isBold(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Bold);
      return;
    }

    if (isItalic(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Italic);
      return;
    }

    if (isUnderline(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Underline);
      return;
    }

    if (isInlineCode(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Code);
      return;
    }

    if (isStrikethrough(event)) {
      toggleInlineTextFlag(editor, InlineTextFlag.Strikethrough);
      return;
    }

    if (isSuperscript(event)) {
      toggleInlineTextScript(editor, InlineTextScript.Superscript);
    }

    if (isSubscript(event)) {
      toggleInlineTextScript(editor, InlineTextScript.Subscript);
    }

    if (isTitle(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.Title);
      return;
    }

    if (isSubtitle(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.Subtitle);
      return;
    }

    if (isCodeBlock(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.CodeBlock);
      return;
    }

    if (isQuote(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.Quote);
      return;
    }

    if (isPullQuote(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.PullQuote);
      return;
    }

    if (isBulletList(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.BulletList);
    }

    if (isNumberedList(event)) {
      toggleContentBlockStyle(editor, ContentBlockStyle.NumberedList);
    }

    if (isClearFormatting(event)) {
      clearStyle(editor);
    }

    next();
  },

  renderEmptyBlockNode(editor, next, props) {
    return (
      <div
        className={getActiveContentBlockStyleClass(
          props.attributes,
          editor.value.document,
          props.blockNodeIndex
        )}
        {...props.requiredContainerElementAttributes}
      >
        {props.children}
      </div>
    );
  },

  renderContentBlockNode(editor, next, props) {
    return (
      <div
        className={getActiveContentBlockStyleClass(
          props.attributes,
          editor.value.document,
          props.blockNodeIndex
        )}
        {...props.requiredContainerElementAttributes}
        {...props.requiredChildrenWrapperElementAttributes}
      >
        {props.children}
      </div>
    );
  },

  renderInlineTextNode(editor, next, props) {
    const { flags, script } = props.attributes;
    const activeClasses: string[] = [];

    if (flags || script !== undefined) {
      if (flags) {
        if (flags & InlineTextFlag.Bold) {
          activeClasses.push(classes.bold);
        }

        if (flags & InlineTextFlag.Italic) {
          activeClasses.push(classes.italics);
        }

        if (flags & InlineTextFlag.Underline) {
          activeClasses.push(classes.underline);
        }

        if (flags & InlineTextFlag.Strikethrough) {
          activeClasses.push(classes.strikethrough);
        }

        if (flags & InlineTextFlag.Code) {
          const contentNode = getContentBlockNodeAtIndex(
            editor.value.document,
            props.blockNodeIndex
          );
          const nextNode = contentNode.content[props.inlineNodeIndex + 1];
          const isLast =
            !nextNode ||
            nextNode.type === InlineNodeType.Void ||
            !nextNode.attributes.flags ||
            !(nextNode.attributes.flags & InlineTextFlag.Code);

          activeClasses.push(classes.code);

          if (isLast) {
            activeClasses.push(classes.lastCode);
          }
        }
      }

      if (script === InlineTextScript.Superscript) {
        activeClasses.push(classes.superscript);
      } else if (script === InlineTextScript.Subscript) {
        activeClasses.push(classes.subscript);
      }

      return (
        <span
          {...props.requiredContainerElementAttributes}
          {...props.requiredTextElementAttributes}
          className={cn(activeClasses)}
        >
          {props.text}
        </span>
      );
    }

    return next();
  },
};

export class Example extends React.Component {
  private _plugin = createReactPlugin({ plugins: richPlugin });
  private _editor = new Editor(initialValue, this._plugin);
  private _editorRef = React.createRef<HTMLElement>();
  private _subscriptions = new CompositeDisposable();

  constructor() {
    super({});

    this._editor.run("onCreateEditorRef", this._editorRef);

    this._subscriptions.add(
      this._editor.onValueChange(() => {
        this.forceUpdate();
      })
    );

    this._subscriptions.add(
      this._editor.onCollapsedCursorInlineTextAttributesChange(() => {
        this.forceUpdate();
      })
    );
  }

  public componentWillUnmount(): void {
    this._subscriptions.dispose();
  }

  public render(): React.ReactNode {
    return (
      <>
        <div
          className={classes.toolbar}
          onMouseDown={this._onEditorToolbarMouseDown}
        >
          {this._renderInlineTextFlagToolbarItem(
            BoldIcon,
            "bold",
            InlineTextFlag.Bold
          )}
          {this._renderInlineTextFlagToolbarItem(
            ItalicIcon,
            "italic",
            InlineTextFlag.Italic
          )}
          {this._renderInlineTextFlagToolbarItem(
            UnderlineIcon,
            "underline",
            InlineTextFlag.Underline
          )}
          {this._renderInlineTextFlagToolbarItem(
            InlineCodeIcon,
            "inline code",
            InlineTextFlag.Code
          )}
          {this._renderInlineTextFlagToolbarItem(
            StrikethroughIcon,
            "strikethrough",
            InlineTextFlag.Strikethrough
          )}
          {this._renderInlineTextScriptToolbarItem(
            SuperscriptIcon,
            "superscript",
            InlineTextScript.Superscript
          )}
          {this._renderInlineTextScriptToolbarItem(
            SubscriptIcon,
            "subscript",
            InlineTextScript.Subscript
          )}
          {this._renderContentBlockToolbarItem(
            TitleIcon,
            "title",
            ContentBlockStyle.Title
          )}
          {this._renderContentBlockToolbarItem(
            SubtitleIcon,
            "subtitle",
            ContentBlockStyle.Subtitle
          )}
          {this._renderContentBlockToolbarItem(
            CodeBlockIcon,
            "code block",
            ContentBlockStyle.CodeBlock
          )}
          {this._renderContentBlockToolbarItem(
            QuoteIcon,
            "quote",
            ContentBlockStyle.Quote
          )}
          {this._renderContentBlockToolbarItem(
            PullQuoteIcon,
            "pullQuote",
            ContentBlockStyle.PullQuote
          )}
          {this._renderContentBlockToolbarItem(
            BulletListIcon,
            "bulletList",
            ContentBlockStyle.BulletList
          )}
          {this._renderContentBlockToolbarItem(
            NumberedListIcon,
            "numbered list",
            ContentBlockStyle.NumberedList
          )}
        </div>
        {this._editor.run("renderEditor", {
          editorRef: this._editorRef,
          editor: this._editor,
          className: cn(classes.editorContent),
          autoCorrect: true,
          spellCheck: true,
        }) || null}
      </>
    );
  }

  private _onEditorToolbarMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
  };

  private _renderInlineTextFlagToolbarItem(
    icon: React.SFC<ToolbarIconProps>,
    tooltipInfo: string,
    flag: InlineTextFlag
  ): JSX.Element {
    return this._renderToolbarItem(
      icon,
      tooltipInfo,
      this._editor.focused && isFlagActive(this._editor, flag),
      () => toggleInlineTextFlag(this._editor, flag)
    );
  }

  private _renderInlineTextScriptToolbarItem(
    icon: React.SFC<ToolbarIconProps>,
    tooltipInfo: string,
    script: InlineTextScript
  ): JSX.Element {
    return this._renderToolbarItem(
      icon,
      tooltipInfo,
      this._editor.focused && isScriptActive(this._editor, script),
      () => toggleInlineTextScript(this._editor, script)
    );
  }

  private _renderContentBlockToolbarItem(
    icon: React.SFC<ToolbarIconProps>,
    tooltipInfo: string,
    style: ContentBlockStyle
  ): JSX.Element {
    return this._renderToolbarItem(
      icon,
      tooltipInfo,
      this._editor.focused && isContentBlockStyleActive(this._editor, style),
      () => toggleContentBlockStyle(this._editor, style)
    );
  }

  private _renderToolbarItem(
    Icon: React.SFC<ToolbarIconProps>,
    tooltipInfo: string,
    isActive: boolean,
    handle: () => void
  ): JSX.Element {
    return (
      <Tooltip info={tooltipInfo}>
        {({ focused }) => (
          <Icon onMouseDown={handle} focused={focused} active={isActive} />
        )}
      </Tooltip>
    );
  }
}

interface ToolbarIconProps extends React.SVGProps<SVGSVGElement> {
  focused?: boolean;
  active?: boolean;
}

function ToolbarIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <svg
      className={cn(
        classes.toolbarIcon,
        props.focused && classes.focusedToolbarIcon,
        props.active && classes.activeToolbarIcon
      )}
      {...omit(props, "focused", "active")}
    >
      {props.children}
    </svg>
  );
}

function BoldIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="11"
      height="14"
      viewBox="0 0 11 14"
      {...props}
    >
      <path d="M4.336 11.883q0.578 0.25 1.094 0.25 2.937 0 2.937-2.617 0-0.891-0.32-1.406-0.211-0.344-0.48-0.578t-0.527-0.363-0.629-0.195-0.656-0.082-0.738-0.016q-0.57 0-0.789 0.078 0 0.414-0.004 1.242t-0.004 1.234q0 0.062-0.008 0.527t-0.004 0.754 0.035 0.652 0.094 0.52zM4.227 6.055q0.328 0.055 0.852 0.055 0.641 0 1.117-0.102t0.859-0.348 0.582-0.699 0.199-1.109q0-0.547-0.227-0.957t-0.617-0.641-0.844-0.34-0.969-0.109q-0.391 0-1.016 0.102 0 0.391 0.031 1.18t0.031 1.187q0 0.211-0.004 0.625t-0.004 0.617q0 0.359 0.008 0.539zM0 13l0.016-0.734q0.117-0.031 0.664-0.125t0.828-0.211q0.055-0.094 0.098-0.211t0.066-0.262 0.043-0.254 0.023-0.293 0.004-0.266v-0.512q0-7.672-0.172-8.008-0.031-0.062-0.172-0.113t-0.348-0.086-0.387-0.055-0.379-0.035-0.238-0.023l-0.031-0.648q0.766-0.016 2.656-0.090t2.914-0.074q0.18 0 0.535 0.004t0.527 0.004q0.547 0 1.066 0.102t1.004 0.328 0.844 0.555 0.578 0.816 0.219 1.074q0 0.406-0.129 0.746t-0.305 0.563-0.504 0.449-0.57 0.352-0.656 0.312q1.203 0.273 2.004 1.047t0.801 1.937q0 0.781-0.273 1.402t-0.73 1.020-1.078 0.668-1.277 0.379-1.375 0.109q-0.344 0-1.031-0.023t-1.031-0.023q-0.828 0-2.398 0.086t-1.805 0.094z" />
    </ToolbarIcon>
  );
}

function ItalicIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="8"
      height="14"
      viewBox="0 0 8 14"
      {...props}
    >
      <path d="M0 12.984l0.133-0.664q0.047-0.016 0.637-0.168t0.871-0.293q0.219-0.273 0.32-0.789 0.008-0.055 0.484-2.258t0.891-4.246 0.406-2.316v-0.195q-0.187-0.102-0.426-0.145t-0.543-0.062-0.453-0.043l0.148-0.805q0.258 0.016 0.937 0.051t1.168 0.055 0.941 0.020q0.375 0 0.77-0.020t0.945-0.055 0.77-0.051q-0.039 0.305-0.148 0.695-0.234 0.078-0.793 0.223t-0.848 0.262q-0.062 0.148-0.109 0.332t-0.070 0.312-0.059 0.355-0.051 0.328q-0.211 1.156-0.684 3.277t-0.605 2.777q-0.016 0.070-0.102 0.453t-0.156 0.703-0.125 0.652-0.047 0.449l0.008 0.141q0.133 0.031 1.445 0.242-0.023 0.344-0.125 0.773-0.086 0-0.254 0.012t-0.254 0.012q-0.227 0-0.68-0.078t-0.672-0.078q-1.078-0.016-1.609-0.016-0.398 0-1.117 0.070t-0.945 0.086z" />
    </ToolbarIcon>
  );
}

function UnderlineIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 12 14"
      {...props}
    >
      <path d="M0.375 1.742q-0.289-0.016-0.352-0.031l-0.023-0.688q0.102-0.008 0.312-0.008 0.469 0 0.875 0.031 1.031 0.055 1.297 0.055 0.672 0 1.313-0.023 0.906-0.031 1.141-0.039 0.438 0 0.672-0.016l-0.008 0.109 0.016 0.5v0.070q-0.469 0.070-0.969 0.070-0.469 0-0.617 0.195-0.102 0.109-0.102 1.031 0 0.102 0.004 0.254t0.004 0.199l0.008 1.789 0.109 2.188q0.047 0.969 0.398 1.578 0.273 0.461 0.75 0.719 0.688 0.367 1.383 0.367 0.813 0 1.492-0.219 0.438-0.141 0.773-0.398 0.375-0.281 0.508-0.5 0.281-0.438 0.414-0.891 0.164-0.57 0.164-1.789 0-0.617-0.027-1t-0.086-0.957-0.105-1.246l-0.031-0.461q-0.039-0.523-0.187-0.688-0.266-0.273-0.602-0.266l-0.781 0.016-0.109-0.023 0.016-0.672h0.656l1.602 0.078q0.594 0.023 1.531-0.078l0.141 0.016q0.047 0.297 0.047 0.398 0 0.055-0.031 0.242-0.352 0.094-0.656 0.102-0.57 0.086-0.617 0.133-0.117 0.117-0.117 0.32 0 0.055 0.012 0.211t0.012 0.242q0.062 0.148 0.172 3.094 0.047 1.523-0.117 2.375-0.117 0.594-0.32 0.953-0.297 0.508-0.875 0.961-0.586 0.445-1.422 0.695-0.852 0.258-1.992 0.258-1.305 0-2.219-0.359-0.93-0.367-1.398-0.953-0.477-0.594-0.648-1.523-0.125-0.625-0.125-1.852v-2.602q0-1.469-0.133-1.664-0.195-0.281-1.148-0.305zM12 12.75v-0.5q0-0.109-0.070-0.18t-0.18-0.070h-11.5q-0.109 0-0.18 0.070t-0.070 0.18v0.5q0 0.109 0.070 0.18t0.18 0.070h11.5q0.109 0 0.18-0.070t0.070-0.18z" />
    </ToolbarIcon>
  );
}

function InlineCodeIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 640 512"
      {...props}
    >
      <path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z" />
    </ToolbarIcon>
  );
}

function StrikethroughIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 512 512"
      {...props}
    >
      <path
        xmlns="http://www.w3.org/2000/svg"
        d="M161.3 144c3.2-17.2 14-30.1 33.7-38.6c21.1-9 51.8-12.3 88.6-6.5c11.9 1.9 48.8 9.1 60.1 12c17.1 4.5 34.6-5.6 39.2-22.7s-5.6-34.6-22.7-39.2c-14.3-3.8-53.6-11.4-66.6-13.4c-44.7-7-88.3-4.2-123.7 10.9c-36.5 15.6-64.4 44.8-71.8 87.3c-.1 .6-.2 1.1-.2 1.7c-2.8 23.9 .5 45.6 10.1 64.6c4.5 9 10.2 16.9 16.7 23.9H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H270.1c-.1 0-.3-.1-.4-.1l-1.1-.3c-36-10.8-65.2-19.6-85.2-33.1c-9.3-6.3-15-12.6-18.2-19.1c-3.1-6.1-5.2-14.6-3.8-27.4zM348.9 337.2c2.7 6.5 4.4 15.8 1.9 30.1c-3 17.6-13.8 30.8-33.9 39.4c-21.1 9-51.7 12.3-88.5 6.5c-18-2.9-49.1-13.5-74.4-22.1c-5.6-1.9-11-3.7-15.9-5.4c-16.8-5.6-34.9 3.5-40.5 20.3s3.5 34.9 20.3 40.5c3.6 1.2 7.9 2.7 12.7 4.3l0 0 0 0c24.9 8.5 63.6 21.7 87.6 25.6l0 0 .2 0c44.7 7 88.3 4.2 123.7-10.9c36.5-15.6 64.4-44.8 71.8-87.3c3.6-21 2.7-40.4-3.1-58.1H335.1c7 5.6 11.4 11.2 13.9 17.2z"
      />
    </ToolbarIcon>
  );
}

function SuperscriptIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 512 512"
      {...props}
    >
      <path d="M480 32c0-11.1-5.7-21.4-15.2-27.2s-21.2-6.4-31.1-1.4l-32 16c-15.8 7.9-22.2 27.1-14.3 42.9C393 73.5 404.3 80 416 80v80c-17.7 0-32 14.3-32 32s14.3 32 32 32h32 32c17.7 0 32-14.3 32-32s-14.3-32-32-32V32zM32 64C14.3 64 0 78.3 0 96s14.3 32 32 32H47.3l89.6 128L47.3 384H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H64c10.4 0 20.2-5.1 26.2-13.6L176 311.8l85.8 122.6c6 8.6 15.8 13.6 26.2 13.6h32c17.7 0 32-14.3 32-32s-14.3-32-32-32H304.7L215.1 256l89.6-128H320c17.7 0 32-14.3 32-32s-14.3-32-32-32H288c-10.4 0-20.2 5.1-26.2 13.6L176 200.2 90.2 77.6C84.2 69.1 74.4 64 64 64H32z" />
    </ToolbarIcon>
  );
}

function SubscriptIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 512 512"
      {...props}
    >
      <path d="M32 64C14.3 64 0 78.3 0 96s14.3 32 32 32H47.3l89.6 128L47.3 384H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H64c10.4 0 20.2-5.1 26.2-13.6L176 311.8l85.8 122.6c6 8.6 15.8 13.6 26.2 13.6h32c17.7 0 32-14.3 32-32s-14.3-32-32-32H304.7L215.1 256l89.6-128H320c17.7 0 32-14.3 32-32s-14.3-32-32-32H288c-10.4 0-20.2 5.1-26.2 13.6L176 200.2 90.2 77.6C84.2 69.1 74.4 64 64 64H32zM480 320c0-11.1-5.7-21.4-15.2-27.2s-21.2-6.4-31.1-1.4l-32 16c-15.8 7.9-22.2 27.1-14.3 42.9C393 361.5 404.3 368 416 368v80c-17.7 0-32 14.3-32 32s14.3 32 32 32h32 32c17.7 0 32-14.3 32-32s-14.3-32-32-32V320z" />
    </ToolbarIcon>
  );
}

function TitleIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 448 512"
      {...props}
    >
      <path d="M0 64C0 46.3 14.3 32 32 32H80h48c17.7 0 32 14.3 32 32s-14.3 32-32 32H112V208H336V96H320c-17.7 0-32-14.3-32-32s14.3-32 32-32h48 48c17.7 0 32 14.3 32 32s-14.3 32-32 32H400V240 416h16c17.7 0 32 14.3 32 32s-14.3 32-32 32H368 320c-17.7 0-32-14.3-32-32s14.3-32 32-32h16V272H112V416h16c17.7 0 32 14.3 32 32s-14.3 32-32 32H80 32c-17.7 0-32-14.3-32-32s14.3-32 32-32H48V240 96H32C14.3 96 0 81.7 0 64z" />
    </ToolbarIcon>
  );
}

function SubtitleIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 384 512"
      {...props}
    >
      <path d="M32 32C14.3 32 0 46.3 0 64S14.3 96 32 96H160V448c0 17.7 14.3 32 32 32s32-14.3 32-32V96H352c17.7 0 32-14.3 32-32s-14.3-32-32-32H192 32z" />
    </ToolbarIcon>
  );
}

function CodeBlockIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 640 512"
      {...props}
    >
      <path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z" />
    </ToolbarIcon>
  );
}

function QuoteIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 448 512"
      {...props}
    >
      <path d="M448 296c0 66.3-53.7 120-120 120h-8c-17.7 0-32-14.3-32-32s14.3-32 32-32h8c30.9 0 56-25.1 56-56v-8H320c-35.3 0-64-28.7-64-64V160c0-35.3 28.7-64 64-64h64c35.3 0 64 28.7 64 64v32 32 72zm-256 0c0 66.3-53.7 120-120 120H64c-17.7 0-32-14.3-32-32s14.3-32 32-32h8c30.9 0 56-25.1 56-56v-8H64c-35.3 0-64-28.7-64-64V160c0-35.3 28.7-64 64-64h64c35.3 0 64 28.7 64 64v32 32 72z" />
    </ToolbarIcon>
  );
}

function PullQuoteIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 512 512"
      {...props}
    >
      <path d="M470.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 256 265.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160zm-352 160l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L210.7 256 73.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z" />
    </ToolbarIcon>
  );
}

function BulletListIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 512 512"
      {...props}
    >
      <path d="M40 48C26.7 48 16 58.7 16 72v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V72c0-13.3-10.7-24-24-24H40zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM16 232v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V232c0-13.3-10.7-24-24-24H40c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V392c0-13.3-10.7-24-24-24H40z" />
    </ToolbarIcon>
  );
}

function NumberedListIcon(props: ToolbarIconProps): JSX.Element {
  return (
    <ToolbarIcon
      version="1.1"
      width="12"
      height="14"
      viewBox="0 0 215 197"
      {...props}
    >
      <g
        xmlns="http://www.w3.org/2000/svg"
        transform="translate(0.000000,197.000000) scale(0.100000,-0.100000)"
        fill="#000000"
        stroke="none"
      >
        <path d="M229 1815 c-14 -8 -32 -28 -39 -45 -11 -27 -11 -37 3 -66 13 -27 26 -36 62 -46 l45 -12 0 -178 0 -178 -30 0 c-85 0 -134 -58 -106 -125 20 -46 55 -55 226 -55 171 0 206 9 226 55 27 66 -20 125 -101 125 l-35 0 0 230 c0 248 -4 271 -51 296 -37 18 -165 18 -200 -1z" />
        <path d="M873 1694 c-90 -45 -73 -189 25 -212 20 -5 261 -8 534 -8 489 1 497 1 525 22 34 25 58 83 49 119 -4 14 -19 40 -35 58 l-29 32 -519 2 c-455 3 -522 1 -550 -13z" />
        <path d="M873 1094 c-33 -16 -63 -66 -63 -104 0 -34 28 -79 63 -100 31 -19 54 -20 532 -20 562 0 552 -1 588 72 24 48 15 97 -25 135 l-29 28 -517 2 c-455 3 -521 1 -549 -13z" />
        <path d="M296 854 c-83 -26 -186 -152 -172 -210 10 -40 42 -64 84 -64 44 0 46 2 95 63 42 51 80 62 111 31 33 -33 20 -61 -86 -176 -57 -62 -124 -135 -150 -163 -26 -28 -50 -63 -53 -77 -9 -37 18 -84 56 -97 48 -17 351 -14 393 3 67 28 68 124 1 154 -14 7 -55 12 -90 12 -36 0 -65 3 -65 6 0 3 33 41 73 85 93 103 110 136 110 215 0 50 -6 72 -27 109 -34 58 -93 100 -157 114 -61 13 -62 13 -123 -5z" />
        <path d="M890 503 c-31 -11 -70 -58 -76 -90 -7 -40 8 -82 43 -115 l25 -23 508 -3 c556 -3 559 -3 597 54 11 17 18 45 17 72 -1 35 -7 50 -33 75 l-31 32 -518 2 c-284 1 -524 -1 -532 -4z" />
      </g>
    </ToolbarIcon>
  );
}
