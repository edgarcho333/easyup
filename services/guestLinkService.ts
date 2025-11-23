
// Guest Links Feature Removed
// This file is kept to prevent build errors in components that reference it

export const guestLinkService = {
  async createLink(
    projectId: string, 
    organizationId: string, 
    userId: string,
    ideaIds: string[],
    data: any
  ): Promise<any> {
    throw new Error("Guest links feature has been removed.");
  },

  async validateLink(token: string): Promise<any> {
    throw new Error("Guest links feature has been removed.");
  },

  async submitGuestAction(
    linkId: string,
    ideaId: string,
    action: string,
    clientName: string,
    comments?: string
  ): Promise<void> {
    throw new Error("Guest links feature has been removed.");
  }
};
