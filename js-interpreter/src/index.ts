import { readFileSync } from "fs";
import { join } from "path";
import { Environment } from "./environment/Environment";
import { Interpreter } from "./environment/Interpreter";
import { ParsingStream } from "./parser/ParsingStream";
import { LexicalStream } from "./parser/LexicalStream";
import { inspect } from "util";

const program = readFileSync(join(__dirname, "../src/playground.ep"), "utf8");

const lexer = new LexicalStream(program);

// const tokens: Token[] = [];

// while (lexer.hasNext()) {
//   const token = lexer.next();
//   token && tokens.push(token);
// }

// console.log(tokens);

const parser = new ParsingStream(lexer);
const ast = parser.parseTopLevel();

console.log(
  inspect(ast, {
    showHidden: false,
    depth: null,
    colors: true,
  })
);

const globalEnv = new Environment();

// define the "out" primitive function
globalEnv.def("Out", console.log);

const interpreter = new Interpreter(ast, globalEnv);

interpreter.run();
