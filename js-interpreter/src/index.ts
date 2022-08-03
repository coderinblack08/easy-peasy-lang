import { inspect } from "util";
import { ASTParsingStream } from "./parser/ASTParsingStream";
import { LexicalStream } from "./parser/LexicalStream";

const program = `
func Sum(x, y)
  return x + y
end

Out(5 + (3 * 6) / 9) # arithmetic expression
Out(Sum(1, 2)) # returns 3
`;

const lexer = new LexicalStream(program);
// const tokens: Token[] = [];

// while (lexer.hasNext()) {
//   const token = lexer.next();
//   token && tokens.push(token);
// }
const parser = new ASTParsingStream(lexer);

console.log(
  inspect(parser.parseTopLevel(), {
    showHidden: false,
    depth: null,
    colors: true,
  })
);
