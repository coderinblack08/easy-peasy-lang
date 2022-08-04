export class Environment {
  vars: { [key: string]: any };
  parent?: Environment;

  constructor(parent?: Environment) {
    this.parent = parent;
    this.vars = Object.create(parent ? parent.vars : null);
  }

  public extend() {
    return new Environment(this);
  }

  public lookup(name: string): Environment | void {
    let scope: Environment | undefined = this;
    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.vars, name)) {
        return scope;
      }
      scope = scope.parent;
    }
  }

  public get(name: string) {
    if (name in this.vars) {
      return this.vars[name];
    }
    throw new Error("Variable not found: " + name);
  }

  public set(name: string, value: any) {
    const scope = this.lookup(name);
    if (!scope && this.parent) {
      throw new Error("Variable not found: " + name);
    }
    return ((scope || this).vars[name] = value);
  }

  public def(name: string, value: any) {
    return (this.vars[name] = value);
  }
}
