import { useCallback } from "react";
import { useNavigate } from "react-router";

// Cloudscape links and buttons fire onFollow with the href: internal links go through the router
// (no page reload), external ones are left to the browser.

interface FollowDetail {
  href?: string;
  external?: boolean;
}

export function useFollow() {
  const navigate = useNavigate();
  return useCallback(
    (event: CustomEvent<FollowDetail>) => {
      const { href, external } = event.detail;
      if (!href || external) return;
      event.preventDefault();
      void navigate(href);
    },
    [navigate],
  );
}
