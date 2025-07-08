import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
  } from "@/components/ui/dropdown-menu";
  import { Button } from "@/components/ui/button";
  import { Home, List, Archive, FileText, X, Menu } from "lucide-react";
  import Link from "next/link";
  
  const TravelButton = ({ setIsMenuOpen }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gradient-to-br from-slate-500 to-purple-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Menu size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-[#1e1b2f] border border-gray-700 text-purple-100">
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center w-full"
            >
              <Home size={16} className="mr-2" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/servicing"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center w-full"
            >
              <List size={16} className="mr-2" />
              Service Logs
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/inventory"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center w-full"
            >
              <Archive size={16} className="mr-2" />
              Inventory
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/expenses"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center w-full"
            >
              <FileText size={16} className="mr-2" />
              Expenses
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/logs"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center w-full"
            >
              <FileText size={16} className="mr-2" />
              Logs
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/reports"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center w-full"
            >
              <FileText size={16} className="mr-2" />
              Reports
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center w-full"
            >
              <X size={16} className="mr-2" />
              Close
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
  export default TravelButton;
  