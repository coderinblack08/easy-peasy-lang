import EventEmitter from "events";
import { Environment } from "./Environment";

export class Interpreter {
  ast: any;
  env: Environment;

  constructor(ast: any, env: Environment) {
    this.ast = ast;
    this.env = env;
  }

  private applyOperation(
    operator: string,
    left: number | boolean,
    right: number | boolean
  ) {
    function checkNum(x: any) {
      if (typeof x != "number") {
        throw new TypeError("Expected number but got " + x);
      }
      return x;
    }

    function checkDivideByZero(x: any) {
      if (checkNum(x) == 0) {
        throw new Error("Divide by zero");
      }
      return x;
    }

    switch (operator) {
      case "+":
        return checkNum(left) + checkNum(right);
      case "-":
        return checkNum(left) - checkNum(right);
      case "*":
        return checkNum(left) * checkNum(right);
      case "/":
        return checkNum(left) / checkDivideByZero(right);
      case "%":
        return checkNum(left) % checkDivideByZero(right);
      case "&&":
        return left !== false && right;
      case "||":
        return left !== false ? left : right;
      case "<":
        return checkNum(left) < checkNum(right);
      case ">":
        return checkNum(left) > checkNum(right);
      case "<=":
        return checkNum(left) <= checkNum(right);
      case ">=":
        return checkNum(left) >= checkNum(right);
      case "==":
        return left === right;
      case "!=":
        return left !== right;
    }
    throw new Error("Can't apply operator " + operator);
  }

  private applyUnary(operator: string, right: number | boolean) {
    switch (operator) {
      case "!":
        return (right === false ? true : false) || (right === 0 ? true : false);
      case "-":
        return -right;
    }
    throw new Error("Can't apply unary operator " + operator);
  }

  private makeFunction(exp: any, scope: Environment) {
    function func(this: Interpreter) {
      const funcScope = this.env.extend();
      const ee = new EventEmitter();
      for (let i = 0; i < exp.params.length; ++i) {
        // array of arguments passed into this closure
        funcScope.def(
          exp.params[i],
          i < arguments.length ? arguments[i] : false
        );
      }
      let output;
      ee.once("return", (result: any) => {
        output = result;
      });
      this.run(exp.body, funcScope, ee);
      return output;
    }
    scope.set(exp.name, func.bind(this));
  }

  public run(
    exp: any = this.ast,
    scope: Environment = this.env,
    ee?: EventEmitter
  ): any {
    if (Array.isArray(exp)) {
      for (const e of exp) {
        const output = this.run(e, scope, ee);
        if (output !== undefined) return output;
      }
    } else {
      switch (exp.type) {
        case "Integer":
        case "Float":
        case "String":
        case "Boolean":
          return exp.value;

        case "Identifier":
          return scope.get(exp.value);

        case "Assign":
          if (exp.left.type !== "Identifier") {
            throw new Error(
              "Left hand side of an assignment must be an identifier"
            );
          }
          return scope.set(exp.left.value, this.run(exp.right, scope, ee));

        case "Binary":
          return this.applyOperation(
            exp.operator,
            this.run(exp.left, scope, ee),
            this.run(exp.right, scope, ee)
          );

        case "Unary":
          return this.applyUnary(exp.operator, this.run(exp.expr, scope, ee));

        case "Function":
          return this.makeFunction(exp, scope);

        case "Call":
          const func: any = this.run(exp.func, scope, ee);
          return func.apply(
            this,
            exp.args.map((arg: any[]) => this.run(arg, scope, ee))
          );

        case "Program":
          let value = false;
          exp.body.forEach(
            (child: any) => (value = this.run(child, scope, ee))
          );
          return value;

        case "If":
          let cond = this.run(exp.condition, scope, ee);
          if (cond !== false) return this.run(exp.then, scope, ee);
          let chain = exp;
          while (true) {
            if (chain && chain.hasOwnProperty("alternative")) {
              chain = chain.alternative;
              if (
                chain !== null &&
                (chain.type === "Else" ||
                  this.run(chain.condition, scope, ee) !== false)
              ) {
                return this.run(chain.then, scope, ee);
              } else {
                break;
              }
            } else {
              break;
            }
          }
          break;

        case "Return":
          const result = this.run(exp.value, scope, ee);
          ee?.emit("return", result);
          return result;

        default:
          throw new Error("Can't evaluate " + JSON.stringify(exp));
      }
    }
  }
}
