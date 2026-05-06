import { PageHeader, PageTitle } from "../page-header/page-header";
import { SeatsHeaderFilter } from "./filter/seats-header-filter";

export const Header = ({ title }: { title: string }) => {
  return (
    <PageHeader>
      <PageTitle>{title}</PageTitle>
      <SeatsHeaderFilter />
    </PageHeader>
  );
};
