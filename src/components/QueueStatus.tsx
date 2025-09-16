import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Users, Timer } from 'lucide-react';

interface QueueStatusProps {
  position?: number;
  estimatedWaitTime?: number;
  totalInQueue: number;
  currentlyServing?: string;
}

export function QueueStatus({ position, estimatedWaitTime, totalInQueue, currentlyServing }: QueueStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Estado de la Cola
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary">{totalInQueue}</div>
            <p className="text-sm text-muted-foreground">En cola</p>
          </div>
          {position && (
            <div className="text-center">
              <div className="text-2xl font-semibold text-primary">{position}</div>
              <p className="text-sm text-muted-foreground">Tu posición</p>
            </div>
          )}
        </div>

        {estimatedWaitTime && (
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
            <Timer className="w-4 h-4" />
            <span className="text-sm">
              Tiempo estimado: <span className="font-semibold">{estimatedWaitTime} minutos</span>
            </span>
          </div>
        )}

        {currentlyServing && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm">
              Atendiendo a: <span className="font-semibold">{currentlyServing}</span>
            </span>
          </div>
        )}

        <div className="flex justify-center">
          <Badge variant={totalInQueue > 5 ? "destructive" : totalInQueue > 2 ? "secondary" : "default"}>
            {totalInQueue === 0 ? "Sin espera" : 
             totalInQueue <= 2 ? "Poca espera" : 
             totalInQueue <= 5 ? "Espera moderada" : "Mucha espera"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}