import { 
  File, 
  FileJson, 
  FileText, 
  Image, 
  Terminal, 
  Hash, 
  Globe, 
  BookText,
  Settings,
  ShieldCheck,
  Braces,
  CodeXml,
  Database,
  Cog,
  FileCode2
} from "lucide-react";

export function getFileIcon(path: string, size = 14) {
  const name = path.split('/').pop()?.toLowerCase() || "";
  const extension = name.split('.').pop()?.toLowerCase();
  
  if (name === 'package.json') return <FileJson size={size} className="text-[#646CFF]" />;
  if (name === 'tsconfig.json') return <FileJson size={size} className="text-[#3178C6]" />;
  if (name === 'bun.lock') return <ShieldCheck size={size} className="text-[#F9F1E1]" />;
  if (name === '.gitignore' || name === '.dockerignore') return <Cog size={size} className="text-[#F05032]" />;
  if (name === 'readme.md') return <BookText size={size} className="text-[#42A5F5]" />;

  switch (extension) {
    case 'py':
      return <Terminal size={size} className="text-[#3776AB]" />;
    case 'js':
    case 'cjs':
    case 'mjs':
      return <FileCode2 size={size} className="text-[#F7DF1E]" />;
    case 'jsx':
      return <CodeXml size={size} className="text-[#61DAFB]" />;
    case 'ts':
      return <FileCode2 size={size} className="text-[#3178C6]" />;
    case 'tsx':
      return <CodeXml size={size} className="text-[#3178C6]" />;
    case 'json':
      return <FileJson size={size} className="text-[#CB9E00]" />;
    case 'html':
      return <Globe size={size} className="text-[#E34F26]" />;
    case 'css':
      return <Hash size={size} className="text-[#1572B6]" />;
    case 'md':
      return <BookText size={size} className="text-[#000000] dark:text-white" />;
    case 'txt':
      return <FileText size={size} className="text-muted" />;
    case 'db':
    case 'sqlite':
    case 'sqlite3':
      return <Database size={size} className="text-[#003B57]" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'ico':
      return <Image size={size} className="text-[#47A248]" />;
    case 'sh':
    case 'bash':
    case 'zsh':
      return <Terminal size={size} className="text-[#4EAA25]" />;
    case 'yml':
    case 'yaml':
      return <Braces size={size} className="text-[#CB171E]" />;
    default:
      if (path.startsWith('.')) return <Settings size={size} className="text-muted" />;
      return <File size={size} className="text-muted" />;
  }
}
