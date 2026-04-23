// src/components/HomeButton.tsx
import Link from "next/link";

export default function HomeButton() {
  return (
    <Link 
      href="/" 
      className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors"
    >
      <span className="mr-2">←</span> メニューに戻る
    </Link>
  );
}