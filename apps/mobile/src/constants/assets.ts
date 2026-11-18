import { DEFAULT_AVATAR_URI } from './default-avatar-uri';

export const DEFAULT_AVATAR = require('../../assets/default-avatar.png');

/**
 * Helper untuk mendapatkan image source avatar:
 * Jika user sudah mengunggah foto profil, gunakan URL tersebut.
 * Jika belum mengunggah atau masih mode tamu, gunakan default avatar siluet abu-abu.
 */
export const getAvatarSource = (avatarUrl?: string | null) => {
  if (
    avatarUrl &&
    typeof avatarUrl === 'string' &&
    avatarUrl.trim().length > 0 &&
    !avatarUrl.includes('placeholder') &&
    !avatarUrl.includes('lh3.googleusercontent.com/aida-public')
  ) {
    return { uri: avatarUrl };
  }
  return DEFAULT_AVATAR;
};

export const ASSETS = {
  defaultAvatar: DEFAULT_AVATAR_URI,
  userAvatar: DEFAULT_AVATAR_URI,
  heroBarber1:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuACfu4O73YZ-uXrNCXTYOX42fc_rDrsmvY_k7AzTNgSbZ3t4XKN3ljsiUA7YgXuNKR-8u3DB7XO4uXPeZoUzeKwlgHJtEBWBtqHkVjHZdC-vou5DDh3d_sQP9O98kCGS5XWXSg22Nm11soAorS2dX6vHse_Oaa94J2wqcSZHbQ84ALGYfGBL4PTmFU7CiDCK7khjRcTclIINv3PoIP_LR0wJovPmNu0-MhKPs1KwSUx',
  heroBarber2:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBGtL28Q37gSYl6NOGT-UWp6T5W8mkZLTo2YxK9xV5iepk1QkyXGNHGxANy3BotUkq8-c3V-kJVGjngeGOkrqQKngvQWvOpw9Mn6-rMjySMm2gWLdiybJV86oY59Oel-juFF7kgg19J-QXXN680dzV0SpzTmVzvW_1RWfczJ_3bvHAMXnqwssk2UMMnJ3I_I8YXBHtEsKgBwh8iL0QhF9e-Y8yyK1JGYoehWQltNP43',
  barberRian:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDdZ8699c9lt35zcw7WyCgxc2wiLpkm_nEX76gaUG797JZw38WoIUA6Nrme8uYr24Xw-mgjs-4zG0aLXeTtTG6FiMLP1FkL2-1_Dvzx9pW54dQLj7L6N2Ml8TrwFIND7tZEZmW_Mp9TzGiullxER8kGnzyQPzu65YALMFIRnfIF1LZAmCTc8kv31G1IWdA-tYmKVFCReHhpSVQ7Ye7WlrbW3ZQ_opVMaWgxui7YqEAm',
  barberBima:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD5Vi-LF9a_yS9fYjDFGva03qURChwgLXj5V0fmH-Xa41GYY4SfcHAMxSCxkZgoLuiXmgSQjQJNSM5qIAypIbu9bacmnbG8n-64WF6LUhofa6R416LK7oavPMg30iQoJZbKFN7nZTPkQyAxZVrcszh9H8Yt5v14mC9eJ1ku93Z56em3HXKwaXQqZBLhbdaK66kbOb0xzqJQhzZqmYxcyTFoU92l8MeZak4AYP3RQ0lS',
  barberAris:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBNsWIbRxBDgeGh97mUJd8qP3F6XDgHBxm5zb19bpUF-o6FfeXsbsMrWu6q6p0S55yqB-TesP6InVeJ7_K5QO95DAjyGhNtAr3hpkmKTaOfumvIvNfxj-y3nvjKGl7Pp96LaPDvL5f1vmU5PUeb5g4wLlEMrDXQspgM-tPSSqOJNQ5WLhtl8iZ38mu_ZcYeBk59cZK0XhStNRsSMFORe_hDFG7xk4mT2HRh8j-E-J6d',
} as const;
