import { AbstractParser, EnclosingContext } from "../../constants";
import Parser = require("tree-sitter");
import PythonLanguage = require("tree-sitter-python");

const processNode = (
  node: any,
  lineStart: number,
  lineEnd: number,
  largestSize: number,
  largestEnclosingContext: Parser.SyntaxNode | null
) => {
  const { startPosition, endPosition } = node;
  if (startPosition.row + 1 <= lineStart && lineEnd <= endPosition.row + 1) {
    const size = endPosition.row - startPosition.row;
    if (size > largestSize) {
      largestSize = size;
      largestEnclosingContext = node;
    }
  }
  return { largestSize, largestEnclosingContext };
};

export class PythonParser implements AbstractParser {
  findEnclosingContext(
    file: string,
    lineStart: number,
    lineEnd: number
  ): EnclosingContext {
    const parser = new Parser();
    parser.setLanguage(PythonLanguage);

    const ast = parser.parse(file);
    let largestEnclosingContext: Parser.SyntaxNode | null = null;
    let largestSize = 0;

    const visitNode = (node: Parser.SyntaxNode) => {
      if (!node) return;

      const type = node.type;

      if (type === "function_definition" || type === "class_definition") {
        ({ largestSize, largestEnclosingContext } = processNode(
          node,
          lineStart,
          lineEnd,
          largestSize,
          largestEnclosingContext
        ));
      }

      for (let i = 0; i < node.childCount; i++) {
        visitNode(node.child(i));
      }
    };

    visitNode(ast.rootNode);

    return { enclosingContext: largestEnclosingContext } as EnclosingContext;
  }
  dryRun(file: string): { valid: boolean; error: string } {
    try {
      const parser = new Parser();
      parser.setLanguage(PythonLanguage);

      parser.parse(file);

      return { valid: true, error: "" };
    } catch (except) {
      return { valid: false, error: except.message };
    }
  }
}
