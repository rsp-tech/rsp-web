export const getRoleLabel = (roleId: number | undefined): string => {
  switch (roleId) {
    case 1:
      return "Admin";
    case 4:
      return "Brahmacari";
    case 5:
      return "BVP";
    case 7:
      return "Aspiring Brahmacari";
    case 8:
      return "Manager";
    default:
      return "Visitor";
  }
};
