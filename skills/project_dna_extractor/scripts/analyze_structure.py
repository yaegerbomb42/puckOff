import os
import ast
import sys
import json

def analyze_directory(target_dir):
    """
    Performs a lightweight static analysis of Python files in the target directory 
    to extract imports, classes, and top-level functions, helping the agent 
    understand the project's structure instantly.
    """
    map_data = {}
    
    for root, _, files in os.walk(target_dir):
        if '.git' in root or '__pycache__' in root or 'venv' in root:
            continue
            
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, target_dir)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        tree = ast.parse(f.read())
                        
                    imports = [node.names[0].name for node in ast.walk(tree) if isinstance(node, ast.Import)]
                    from_imports = [node.module for node in ast.walk(tree) if isinstance(node, ast.ImportFrom) and node.module]
                    classes = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
                    functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
                    
                    map_data[rel_path] = {
                        "dependencies": list(set(imports + from_imports)),
                        "classes": classes,
                        "functions": functions
                    }
                except Exception as e:
                    map_data[rel_path] = {"error": str(e)}
                    
    print(json.dumps(map_data, indent=2))

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    analyze_directory(target)
