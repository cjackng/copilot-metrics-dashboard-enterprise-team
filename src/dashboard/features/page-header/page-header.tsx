import { FC, PropsWithChildren } from "react";

interface Props extends PropsWithChildren {}

export const PageHeader = (props: Props) => {
  return (
    <div className="bg-background py-4 border-b ">
      <div className="mx-auto flex flex-col w-full max-w-screen-2xl px-4 md:px-8 gap-8">
        {props.children}
      </div>
    </div>
  );
};

export const PageTitle: FC<PropsWithChildren> = (props) => {
  return (
    <h1 className="text-3xl font-semibold tracking-tighter">
      {props.children}
    </h1>
  );
};
