export function sanitizeForUrl(text: string) {
  let sanitizedText = text.toLowerCase();
  sanitizedText = sanitizedText.replace(/\s+/g, '-');
  sanitizedText = sanitizedText.replace(/[^a-z0-9-]/g, '');

  return sanitizedText;
}

interface TreeNode {
  path: string;
  basename: string;
  isFile: boolean;
  timestamp?: number;
  children: { [key: string]: TreeNode };
}

interface JsonData {
  [key: string]: number;
}

export function createFileTree(
  jsonData: JsonData,
  folderPath?: string,
): { [key: string]: TreeNode } {
  const tree: { [key: string]: TreeNode } = {};

  for (const fullPath in jsonData) {
    if (!jsonData.hasOwnProperty(fullPath)) {
      continue;
    }

    if (folderPath && !fullPath.startsWith(folderPath)) {
      continue;
    }

    const relativePath = folderPath
      ? fullPath.substring(folderPath.length).replace(/^\//, '')
      : fullPath;
    const parts = relativePath.split('/');
    let currentNode = tree;
    let currentPath = folderPath || '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!currentNode[part]) {
        currentNode[part] = {
          path: currentPath,
          basename: part,
          isFile: isFile,
          children: {},
        };
      }

      if (isFile) {
        currentNode[part].timestamp = jsonData[fullPath];
      } else {
        currentNode = currentNode[part].children;
      }
    }
  }

  return tree;
}
