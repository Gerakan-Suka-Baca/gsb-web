import { Suspense } from "react";
import { TryoutList } from "../components/TryoutList";
import { TryoutListSkeleton } from "../components/TryoutListSkeleton";

export const TryoutListView = ({}) => {
  return (
    <Suspense fallback={<TryoutListSkeleton />}>
      <TryoutList />
    </Suspense>
  );
};
