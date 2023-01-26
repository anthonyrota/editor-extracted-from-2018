import {
  hasInputEventsLevel2,
  isFirefox,
  isIE,
  isIOS,
} from "utils/environment";
import { getWindow } from "utils/getWindow";
import { Plugin } from "../editor";
import { deleteSelection } from "../editor/deleteSelection";
import {
  isBold,
  isCompose,
  isDeleteBackward,
  isDeleteForward,
  isDeleteLineBackward,
  isDeleteLineForward,
  isDeleteWordBackward,
  isDeleteWordForward,
  isItalic,
  isRedo,
  isSplitBlock,
  isTransposeCharacter,
  isUndo,
} from "../utils/shortcuts";
import { isNodeAtElementVoid } from "./isNodeAtElementVoid";
import { ReactArgumentsMap } from "./ReactArgumentsMap";

export function createBeforePlugin(): Plugin<
  any,
  any,
  any,
  any,
  ReactArgumentsMap<any, any, any, any>
> {
  let compositionCount = 0;
  let isComposing = false;
  let isCopying = false;
  let isDragging = false;
  let activeElement: Element | undefined | null;
  let editorRef: React.RefObject<HTMLElement> | undefined;

  return {
    onCreateEditorRef(editor, next, ref) {
      editorRef = ref;
      next();
    },

    onBeforeInput(editor, next, event) {
      if (hasInputEventsLevel2) {
        return;
      }

      next();
    },

    onBlur(editor, next, event) {
      if (isCopying) {
        return;
      }

      const window = getWindow(event.target);

      // COMPAT: If the current `activeElement` is still the previous one, this is
      // due to the window being blurred when the tab itself becomes unfocused, so
      // we want to abort early to allow to editor to stay focused when the tab
      // becomes focused again.
      if (activeElement === window.document.activeElement) {
        return;
      }

      // COMPAT: The `relatedTarget` can be null when the new focus target is not
      // a "focusable" element (eg. a `<div>` without `tabindex` set).
      if (event.relatedTarget) {
        // COMPAT: The event should be ignored if the focus is returning to the
        // editor from an embedded editable element (eg. an <input> element inside
        // a void node).
        if (event.relatedTarget === editorRef!.current) {
          return;
        }

        // COMPAT: The event should be ignored if the focus is moving to a non-
        // editable section of an element that isn't a void node (eg. a list item
        // of the check list example).
        if (
          editorRef!.current!.contains(event.relatedTarget as Node) &&
          !isNodeAtElementVoid(
            event.relatedTarget as Node,
            editor.value.document
          )
        ) {
          return;
        }
      }

      next();
    },

    onCompositionStart(editor, next, event) {
      isComposing = true;
      compositionCount++;

      deleteSelection(editor);
      next();
    },

    onCompositionEnd(editor, next, event) {
      const currentCount = compositionCount;
      const window = getWindow(event.target as Node);

      // The `count` check here ensures that if another composition starts
      // before the timeout has closed out this one, we will abort unsetting the
      // `isComposing` flag, since a composition is still in affect.
      window.requestAnimationFrame(() => {
        if (compositionCount > currentCount) {
          return;
        }

        isComposing = false;
      });

      next();
    },

    onCopy(editor, next, event) {
      const window = getWindow(event.target as Node);
      isCopying = true;

      window.requestAnimationFrame(() => {
        isCopying = false;
      });

      next();
    },

    onCut(editor, next, event) {
      const window = getWindow(event.target as Node);
      isCopying = true;

      window.requestAnimationFrame(() => {
        isCopying = false;
      });

      next();
    },

    onDragStart(editor, next, event) {
      isDragging = true;
      next();
    },

    onDragEnd(editor, next, event) {
      isDragging = false;
      next();
    },

    onDragOver(editor, next, event) {
      // If the target is inside a void node, and only in this case,
      // call `preventDefault` to signal that drops are allowed.
      // When the target is editable, dropping is already allowed by
      // default, and calling `preventDefault` hides the cursor.
      if (isNodeAtElementVoid(event.target as Node, editor.value.document)) {
        event.preventDefault();
      }

      // COMPAT: IE won't call onDrop on contentEditables unless the
      // default dragOver is prevented:
      // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/913982/
      if (isIE) {
        event.preventDefault();
      }

      // If a drag is already in progress, don't do this again.
      if (!isDragging) {
        isDragging = true;

        // COMPAT: IE will raise an `unspecified error` if dropEffect is
        // set.
        if (!isIE) {
          event.dataTransfer.dropEffect = "move";
        }
      }

      next();
    },

    onDrop(editor, next, event) {
      event.preventDefault();
      next();
    },

    onFocus(editor, next, event) {
      if (isCopying) {
        return;
      }

      const window = getWindow(event.target);
      activeElement = window.document.activeElement;

      // COMPAT: If the editor has nested editable elements, the focus can go to
      // those elements. In Firefox, this must be prevented because it results in
      // issues with keyboard navigation.
      if (isFirefox && event.target !== editorRef!.current) {
        editorRef!.current!.focus();
        return;
      }

      next();
    },

    onInput(editor, next, event) {
      if (isComposing || !editor.focused) {
        return;
      }

      next();
    },

    onKeyDown(editor, next, event) {
      // When composing, we need to prevent all hotkeys from executing while
      // typing. However, certain characters also move the selection before
      // we're able to handle it, so prevent their default behavior.
      if (isComposing) {
        if (isCompose(event)) {
          event.preventDefault();
        }
        return;
      }

      // Certain hotkeys have native editing behaviors in `contenteditable`
      // elements which will edit the DOM and cause our value to be out of sync,
      // so they need to always be prevented.
      if (
        !isIOS &&
        (isBold(event) ||
          isDeleteBackward(event) ||
          isDeleteForward(event) ||
          isDeleteLineBackward(event) ||
          isDeleteLineForward(event) ||
          isDeleteWordBackward(event) ||
          isDeleteWordForward(event) ||
          isItalic(event) ||
          isRedo(event) ||
          isSplitBlock(event) ||
          isTransposeCharacter(event) ||
          isUndo(event))
      ) {
        event.preventDefault();
      }

      next();
    },

    onPaste(editor, next, event) {
      event.preventDefault();
      next();
    },

    onSelect(editor, next, event) {
      console.log("onSelect");
      if (isCopying || isComposing) {
        return;
      }

      const window = getWindow(event.target as Node);
      activeElement = window.document.activeElement;
      next();
    },
  };
}
