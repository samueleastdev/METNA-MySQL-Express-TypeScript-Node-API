export function sanitizeForUrl(text: string) {
  let sanitizedText = text.toLowerCase();
  sanitizedText = sanitizedText.replace(/\s+/g, '-');
  sanitizedText = sanitizedText.replace(/[^a-z0-9-]/g, '');

  return sanitizedText;
}

export function getBasename(filePath: string): string {
  return filePath.split('/').pop() || '';
}

export function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }

  return result;
}

export function isStrongPassword(password: string) {
  if (password.length < 8) {
    return false;
  }

  if (!/[A-Z]/.test(password)) {
    return false;
  }

  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/.test(password)) {
    return false;
  }

  return true;
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

  if (folderPath) {
    tree['..'] = {
      path: folderPath.split('/').slice(0, -1).join('/') || '/',
      basename: '..',
      isFile: false,
      children: {},
    };
  }

  for (const fullPath in jsonData) {
    if (!jsonData.hasOwnProperty(fullPath)) continue;
    if (folderPath && !fullPath.startsWith(folderPath)) continue;

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

  return sortTree(tree);
}

function sortTree(treeNode: { [key: string]: TreeNode }): { [key: string]: TreeNode } {
  const sortedKeys = Object.keys(treeNode).sort((a, b) => {
    const isFileA = treeNode[a].isFile;
    const isFileB = treeNode[b].isFile;
    if (isFileA && !isFileB) return 1;
    if (!isFileA && isFileB) return -1;
    return a.localeCompare(b);
  });

  const sortedTree: { [key: string]: TreeNode } = {};
  for (const key of sortedKeys) {
    sortedTree[key] = treeNode[key];
    if (!treeNode[key].isFile) {
      sortedTree[key].children = sortTree(treeNode[key].children);
    }
  }

  return sortedTree;
}
