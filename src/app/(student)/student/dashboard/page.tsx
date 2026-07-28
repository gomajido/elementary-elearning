import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDashboardPage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome!</CardTitle>
      </CardHeader>
      <CardContent className="text-base text-muted-foreground">
        Your courses and quizzes will show up here soon.
      </CardContent>
    </Card>
  );
}
