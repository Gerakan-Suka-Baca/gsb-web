import { Suspense } from "react";
import { TryoutsList } from "../components/tryouts-list";

export const TryoutListView = ({}) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TryoutsList />
    </Suspense>
  );
};
