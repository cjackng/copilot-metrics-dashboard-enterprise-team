import { PageHeader, PageTitle } from "../page-header/page-header";

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  return (
    <PageHeader>
      <PageTitle>{title}</PageTitle>
    </PageHeader>
  );
};
