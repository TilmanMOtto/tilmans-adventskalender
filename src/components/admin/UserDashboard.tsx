import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProgress {
  id: string;
  username: string;
  created_at: string;
  doorsOpened: number[];
  totalDoors: number;
  percentage: number;
}

const UserDashboard = () => {
  const [usersProgress, setUsersProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const totalDays = 24;

  useEffect(() => {
    fetchUserProgress();
  }, []);

  const fetchUserProgress = async () => {
    setLoading(true);
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select(`
        id,
        username,
        created_at
      `)
      .order("username");

    if (!profiles) {
      setLoading(false);
      return;
    }

    const progressPromises = profiles.map(async (profile) => {
      const { data: progress } = await supabase
        .from("user_progress")
        .select("day_number")
        .eq("user_id", profile.id)
        .order("day_number");

      const doorsOpened = progress?.map((p) => p.day_number) || [];
      const percentage = (doorsOpened.length / totalDays) * 100;

      return {
        id: profile.id,
        username: profile.username,
        created_at: profile.created_at,
        doorsOpened,
        totalDoors: totalDays,
        percentage,
      };
    });

    const progressData = await Promise.all(progressPromises);
    setUsersProgress(progressData);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading user progress...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersProgress.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersProgress.length > 0
                ? Math.round(
                    usersProgress.reduce((acc, user) => acc + user.percentage, 0) /
                      usersProgress.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Doors Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersProgress.reduce((acc, user) => acc + user.doorsOpened.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="hidden md:table-cell">Doors Opened</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersProgress.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            {user.doorsOpened.length} / {user.totalDoors}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(user.percentage)}%
                          </span>
                        </div>
                        <Progress value={user.percentage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                          <Badge
                            key={day}
                            variant={user.doorsOpened.includes(day) ? "default" : "outline"}
                            className="w-8 h-8 flex items-center justify-center text-xs"
                          >
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
