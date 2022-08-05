import { inspect } from "util";
import { Environment } from "./environment/Environment";
import { Interpreter } from "./environment/Interpreter";
import { ASTParsingStream } from "./parser/ASTParsingStream";
import { LexicalStream, Token } from "./parser/LexicalStream";

const program = `
# Block function
func Sum(x, y)
  return x + y
end

# Inline function, automatically returns the singular expression
func Subtract(x, y) x - y

n = 8

if n > 4
  Out("n is greater than 4")
elif n < 4
  Out("n is less than 4")
else
  Out("n is equal to 4")
end

x = !(False || !False) && !False
y = True
z = -48 # negation?
Out(x, y, z)
if y || x
  Out("y or x are true")

# recursive function calls
# early returns as well
func fib(n)
  # Out(n)
  if n < 2
    return n
  end
  # Out("fib(", n - 1, ") + fib(", n - 2, ")")
  return fib(n - 1) + fib(n - 2)
end

Out(fib(10))

Out(1 + 2 - 3) # addition and subtraction
Out(5 + 3 * 6 / 9) # arithmetic expression

Out(Sum(1, 2)) # returns 3
Out(Subtract(8, 4)) # returns 4
`;

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
