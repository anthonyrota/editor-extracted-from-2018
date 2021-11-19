import { Editor } from '.'
import { createDocument } from '../document'
import {
  BlockNode,
  BlockNodeType,
  ContentBlockNode,
  createContentBlockNode,
  createEmptyBlockNode,
  createVoidBlockNode,
  EmptyBlockNode
} from '../node'
import { Range } from '../range'
import { createValue } from '../value'

export function changeBlockAttributesInRange<
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
  range: Range,
  changeContentBlockAttributes?: (
    attributes: ContentBlockAttributes
  ) => ContentBlockAttributes,
  changeVoidBlockAttributes?: (
    attributes: VoidBlockAttributes
  ) => VoidBlockAttributes
): void {
  const { document, selection } = editor.value

  let newBlockNodes:
    | Array<
        BlockNode<
          ContentBlockAttributes,
          VoidBlockAttributes,
          InlineTextAttributes,
          InlineVoidAttributes
        >
      >
    | undefined

  for (let i = range.start.blockNodeIndex; i <= range.end.blockNodeIndex; i++) {
    const blockNode = document.blockNodes[i]

    if (blockNode.type === BlockNodeType.Void) {
      if (changeVoidBlockAttributes) {
        const newAttributes = changeVoidBlockAttributes(blockNode.attributes)

        if (
          !document.meta.areVoidBlockAttributesEqual(
            blockNode.attributes,
            newAttributes
          )
        ) {
          if (!newBlockNodes) {
            newBlockNodes = document.blockNodes.slice()
          }

          newBlockNodes[i] = createVoidBlockNode(newAttributes, blockNode.key)
        }
      }
    } else if (changeContentBlockAttributes) {
      const newAttributes = changeContentBlockAttributes(blockNode.attributes)

      if (
        !document.meta.areContentBlockAttributesEqual(
          blockNode.attributes,
          newAttributes
        )
      ) {
        if (!newBlockNodes) {
          newBlockNodes = document.blockNodes.slice()
        }

        newBlockNodes[i] = changeEmptyOrContentBlockNodeAttributes(
          blockNode,
          newAttributes
        )
      }
    }
  }

  if (newBlockNodes) {
    editor.save(
      createValue(selection, createDocument(newBlockNodes, document.meta))
    )
  }
}

function changeEmptyOrContentBlockNodeAttributes<
  ContentBlockAttributes,
  InlineTextAttributes,
  InlineVoidAttributes
>(
  blockNode:
    | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
    | ContentBlockNode<
        ContentBlockAttributes,
        InlineTextAttributes,
        InlineVoidAttributes
      >,
  newAttributes: ContentBlockAttributes
):
  | EmptyBlockNode<ContentBlockAttributes, InlineTextAttributes>
  | ContentBlockNode<
      ContentBlockAttributes,
      InlineTextAttributes,
      InlineVoidAttributes
    > {
  if (blockNode.type === BlockNodeType.Empty) {
    return createEmptyBlockNode(
      newAttributes,
      blockNode.inlineAttributes,
      blockNode.key
    )
  }

  return createContentBlockNode(blockNode.content, newAttributes, blockNode.key)
}
