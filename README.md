# Easy-Peasy

Easy-Peasy is a scripting language designed for ease of use and a educational language for beginners.

In this project, there is a interpreter designed to run in the browser and a transpiler written in Go.

> Upcoming: Graphical block-language for developing Easy-Peasy programs.

## Language Spec

All built-in variables are uppercase, including booleans; keywords are lowercase.

- Variables & Built-in Data Types

```rb
n = 0
n = Int("0") # type-casting
b = True
y = "hello world"

l = List()

# commands
l.Add("first element")
l.Add("second element")
l.Pop()

Print(l.At(0))
Print(l.At(1))
Print(l.At(-1))

m = Map()
s = Set()
```

- For and While Loops

```rb
x = 10

while x > 5
  Print("X is very long")
end

for i in Range(1, 5)
  print(i)
end
```

- Conditionals

```rb
x = 4
if x > 5
  Print("X is extra long")
else
  print("X is way too small for my liking")
end
```

- Functions

```rb
func SplitEqually(num)
  a = Int(num / 2)
  b = num - a
  Return a, b
end
```

- Sprites (Objects)

```rb
sprite Dog
  func Init(self, name, age)
    self.name = name
    self.age = age
  end

  func GetHumanAge(self)
    return self.age * 4
  end
end

dog = Dog("clifford", 5)
Print(dog.GetHumanAge());
```
