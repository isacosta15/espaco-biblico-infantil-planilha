import React from "react";
import { Link } from "wouter";
import { Child } from "@workspace/api-client-react";
import { calculateAge, getGenderColor } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User as UserIcon } from "lucide-react";

interface ChildCardProps {
  child: Child;
  action?: React.ReactNode;
}

export function ChildCard({ child, action }: ChildCardProps) {
  const age = child.age ?? calculateAge(child.birthDate);
  const isOlder = age >= 12;

  const cardClassName = `transition-all duration-200 hover-elevate ${
    isOlder ? "border-yellow-400 border-2" : "border"
  }`;

  const content = (
    <Card className={cardClassName}>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1 gap-2">
            <h3 className="font-bold text-lg text-foreground truncate">{child.fullName}</h3>
            {isOlder && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 shrink-0">
                12+
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className={getGenderColor(child.gender)}>
              {child.gender === 'F' ? 'Menina' : 'Menino'}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">{age} anos</span>
            
            {child.autism && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
                TEA
              </Badge>
            )}
            {child.foodRestriction && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200" title={child.foodRestrictionDescription || "Restrição alimentar"}>
                🥜 Restrição
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              <span className="truncate">{child.guardianName}</span>
            </div>
            {child.congregationName && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{child.congregationName}</span>
              </div>
            )}
          </div>
        </div>

        {action && (
          <div className="shrink-0" onClick={(e) => e.preventDefault()}>
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Link href={`/criancas/${child.id}`}>
      <a className="block">{content}</a>
    </Link>
  );
}
