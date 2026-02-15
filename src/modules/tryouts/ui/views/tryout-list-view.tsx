import { Suspense } from "react";
import { TryoutsList } from "../components/tryouts-list";
import { TryoutListSkeleton } from "../components/tryout-list-skeleton";

export const TryoutListView = ({}) => {
  return (
    <Suspense fallback={<TryoutListSkeleton />}>
      <TryoutsList />
    </Suspense>
  );
};
