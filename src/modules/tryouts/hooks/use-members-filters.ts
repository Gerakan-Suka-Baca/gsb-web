// import { useQueryStates, parseAsString } from "nuqs";

// const getDefaultYear = () => {
//   const now = new Date();
//   const currentMonth = now.getMonth() + 1;
//   const defaultYear = now.getFullYear() - 1;

//   if (currentMonth <= 8) {
//     return defaultYear.toString();
//   }

//   return String(now.getFullYear());
// };

// export const params = {
//   year: parseAsString
//     .withOptions({ clearOnDefault: true })
//     .withDefault(getDefaultYear()),
// };

// export const useMembersFilters = () => {
//   return useQueryStates(params);
// };
