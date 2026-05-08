import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ChartHeader } from "@/features/common/chart-header";

interface StatsCardProps {
  title: string;
  description: string;
  tip?: string;
  value: string;
}

export default function StatsCard(props: StatsCardProps) {
  const length = props.value.length;
  let fontSize = "text-[2.4rem]";
  
  if (length > 16) {
    fontSize = "text-[1.5rem]";
  } else if (length > 12) {
    fontSize = "text-[1.75rem]";
  } else if (length > 8) {
    fontSize = "text-[2rem]";
  }
  return (
    <Card className="flex flex-col min-h-[140px]">
      <ChartHeader title={props.title} description={props.description} tip={props.tip} />
      <CardContent className="flex items-center justify-center flex-1 py-0">
        <CardTitle className={`${fontSize} flex-1 tracking-tighter font-bold`}>
          {props.value}
        </CardTitle>
      </CardContent>
    </Card>
  );
}