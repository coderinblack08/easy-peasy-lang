import { readFileSync } from "fs";
import { join } from "path";
import { inspect } from "util";
import { Environment } from "./environment/Environment";
import { Interpreter } from "./environment/Interpreter";
import { ASTParsingStream } from "./parser/ASTParsingStream";
import { LexicalStream, Token } from "./parser/LexicalStream";

const program = readFileSync(join(__dirname, "../src/playground.ep"), "utf8");

const lexer = new LexicalStream(program);

// const tokens: Token[] = [];

// while (lexer.hasNext()) {
//   const token = lexer.next();
//   token && tokens.push(token);
// }

// console.log(tokens);

const parser = new ASTParsingStream(lexer);
const ast = parser.parseTopLevel();

// console.log(
//   inspect(ast, {
//     showHidden: false,
//     depth: null,
//     colors: true,
//   })
// );

const globalEnv = new Environment();

// define the "out" primitive function
globalEnv.def("Out", console.log);

const interpreter = new Interpreter(ast, globalEnv);

interpreter.run();
