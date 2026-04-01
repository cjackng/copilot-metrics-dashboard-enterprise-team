import { PageHeader, PageTitle } from "../page-header/page-header";

interface HeaderProps {
  isCosmosDb?: boolean;
}

export const Header = ({ isCosmosDb }: HeaderProps) => {
  return (
    <PageHeader>
      <PageTitle>Premium Requests Usage</PageTitle>
    </PageHeader>
  );
};
