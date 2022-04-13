# scss-compiler

## shell command
```
cd C:/Program Files/sass-compiler && node index [filePath]
```

## custom dir
```
cd C:/Program Files/sass-compiler && node index [filePath] --dir='./build'
```

## custom sublime-build
```json
{
    "shell_cmd": "cd C:/Program Files/sass-compiler && node index $file --dir='./build'",
    "selector": "source.scss",
}
```
