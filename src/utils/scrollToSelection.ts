import { isIOS } from "utils/environment";
import { getWindow } from "utils/getWindow";

export function scrollToSelection(selection: Selection) {
  if (isIOS11 || !selection.anchorNode) {
    return;
  }

  const window = getWindow(selection.anchorNode);
  const scroller = findScrollContainer(selection.anchorNode, window);
  const isWindow =
    scroller === window.document.body ||
    scroller === window.document.documentElement;
  const backward = isSelectionBackward(selection);

  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(backward);
  let cursorRect = range.getBoundingClientRect();

  // console.log(scroller)

  // COMPAT: range.getBoundingClientRect() returns 0s when range is
  // collapsed. Expanding the range by 1 is a relatively effective workaround
  // for vertical scroll, although horizontal may be off by 1 character.
  // https://bugs.webkit.org/show_bug.cgi?id=138949
  // https://bugs.chromium.org/p/chromium/issues/detail?id=435438
  if (range.collapsed && cursorRect.top === 0 && cursorRect.height === 0) {
    if (range.startContainer.nodeName === "BR") {
      cursorRect = (
        range.startContainer as HTMLElement
      ).getBoundingClientRect();
    } else {
      if (range.startOffset === 0) {
        range.setEnd(range.endContainer, 1);
      } else {
        range.setStart(range.startContainer, range.startOffset - 1);
      }

      cursorRect = range.getBoundingClientRect();

      if (cursorRect.top === 0 && cursorRect.height === 0) {
        if (range.getClientRects().length) {
          cursorRect = range.getClientRects()[0];
        }
      }
    }
  }

  let width;
  let height;
  let yOffset;
  let xOffset;
  let scrollerTop = 0;
  let scrollerLeft = 0;
  let scrollerBordersY = 0;
  let scrollerBordersX = 0;
  let scrollerPaddingTop = 0;
  let scrollerPaddingBottom = 0;
  let scrollerPaddingLeft = 0;
  let scrollerPaddingRight = 0;

  if (isWindow) {
    const clientWidth = document.documentElement.clientWidth;
    const clientHeight = document.documentElement.clientHeight;
    const { pageYOffset, pageXOffset } = window;
    width = clientWidth;
    height = clientHeight;
    yOffset = pageYOffset;
    xOffset = pageXOffset;
  } else {
    const { top, left } = scroller.getBoundingClientRect();
    const style = window.getComputedStyle(scroller);
    const borderTopWidth = parseInt(style.borderTopWidth || "0", 10);
    const borderBottomWidth = parseInt(style.borderBottomWidth || "0", 10);
    const borderLeftWidth = parseInt(style.borderLeftWidth || "0", 10);
    const borderRightWidth = parseInt(style.borderRightWidth || "0", 10);
    const paddingTop = parseInt(style.paddingTop || "0", 10);
    const paddingBottom = parseInt(style.paddingBottom || "0", 10);
    const paddingLeft = parseInt(style.paddingLeft || "0", 10);
    const paddingRight = parseInt(style.paddingRight || "0", 10);

    width = scroller.clientWidth;
    height = scroller.clientHeight;
    scrollerTop = top + borderTopWidth;
    scrollerLeft = left + borderLeftWidth;
    scrollerBordersY = borderTopWidth + borderBottomWidth;
    scrollerBordersX = borderLeftWidth + borderRightWidth;
    scrollerPaddingTop = paddingTop;
    scrollerPaddingBottom = paddingBottom;
    scrollerPaddingLeft = paddingLeft;
    scrollerPaddingRight = paddingRight;
    yOffset = scroller.scrollTop;
    xOffset = scroller.scrollLeft;
  }

  const cursorTop = cursorRect.top + yOffset - scrollerTop;
  const cursorLeft = cursorRect.left + xOffset - scrollerLeft;

  let x = xOffset;
  let y = yOffset;

  if (cursorLeft < xOffset) {
    // selection to the left of viewport
    x = cursorLeft - scrollerPaddingLeft;
  } else if (
    cursorLeft + cursorRect.width + scrollerBordersX >
    xOffset + width
  ) {
    // selection to the right of viewport
    x = cursorLeft + scrollerBordersX + scrollerPaddingRight - width;
  }

  if (cursorTop < yOffset) {
    // selection above viewport
    y = cursorTop - scrollerPaddingTop;
  } else if (
    cursorTop + cursorRect.height + scrollerBordersY >
    yOffset + height
  ) {
    // selection below viewport
    y =
      cursorTop +
      scrollerBordersY +
      scrollerPaddingBottom +
      cursorRect.height -
      height;
  }

  if (isWindow) {
    window.scrollTo(x, y /* + 10*/);
  } else {
    scroller.scrollTop = y; /* + 10*/
    scroller.scrollLeft = x;
  }
}

const isIOS11 = isIOS && !!window.navigator.userAgent.match(/os 11_/i);

function isScrollable(element: Element, window: Window): boolean {
  const style = window.getComputedStyle(element);
  const { overflowY } = style;

  return (
    (overflowY && overflowY === "auto") ||
    overflowY === "overlay" ||
    overflowY === "scroll"
  );
}

function findScrollContainer(node: Node, window: Window): HTMLElement {
  let parent = node.parentNode as HTMLElement;
  let scroller: HTMLElement | undefined;

  while (!scroller) {
    if (!parent || !parent.parentNode) {
      break;
    }

    if (isScrollable(parent, window)) {
      scroller = parent;
      break;
    }

    parent = parent.parentNode as HTMLElement;
  }

  // COMPAT: Because Chrome does not allow document.body.scrollTop, we're
  // assuming that window.scrollTo() should be used if the scrollable element
  // turns out to be document.body or document.documentElement. This will work
  // unless body is intentionally set to scrollable by restricting its height
  // (e.g. height: 100vh).
  if (!scroller) {
    return window.document.body;
  }

  return scroller;
}

function isSelectionBackward(selection: Selection): boolean {
  const position = selection.anchorNode.compareDocumentPosition(
    selection.focusNode
  );

  return !(
    position === 4 /* Node.DOCUMENT_POSITION_FOLLOWING */ ||
    (position === 0 && selection.anchorOffset < selection.focusOffset)
  );
}
