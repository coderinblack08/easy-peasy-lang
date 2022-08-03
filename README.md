# Easy-Peasy

Easy-Peasy is a scripting language designed for ease of use and a educational language for beginners.

In this project, there is a interpreter designed to run in the browser and a transpiler written in Go.

> Upcoming: Graphical block-language for developing Easy-Peasy programs.

## Language Spec

All built-in variables are uppercase, including booleans; keywords are lowercase.

- Variables & Built-in Data Types

```py
n = 0
n = Int("0") # type-casting
b = True
y = "hello world"

l = List()

# commands
l.Add("first element")
l.Add("second element")
l.Pop()

Out(l.At(0))
Out(l.At(1))
Out(l.At(-1))

m = Map()
s = Set()
```

- For and While Loops

```py
x = 10

while x > 5
  Out("X is very long")
end

for i in Range(1, 5)
  Out(i)
end
```

- Conditionals

```py
x = 4
if x > 5
  Out("X is extra long")
elif x > 4
  Out("X is average length")
else
  Out("X is way too small for my liking")
end
```

- Functions

```py
func SplitEqually(num)
  a = Int(num / 2)
  b = num - a
  Return a, b
end
```

- Sprites (Objects)

```py
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
Out(dog.GetHumanAge());
```
