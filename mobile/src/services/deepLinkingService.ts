/**
 * Deep Linking Service
 * Handles navigation from widgets and external sources
 * Supports doit:// URL scheme
 */

import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

export type DeepLinkRoute =
  | 'today'
  | 'task'
  | 'stats'
  | 'smart-assistant'
  | 'quick-add';

export interface DeepLinkParams {
  taskId?: string;
  date?: string;
  [key: string]: any;
}

class DeepLinkingService {
  private navigationRef: NavigationContainerRef<any> | null = null;

  /**
   * Initialize deep linking service
   * @param navigationRef Reference to the navigation container
   */
  initialize(navigationRef: NavigationContainerRef<any>) {
    this.navigationRef = navigationRef;

    // Listen for deep link events
    Linking.addEventListener('url', this.handleDeepLink);

    // Handle initial URL if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink({ url });
      }
    });
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    Linking.removeAllListeners('url');
  }

  /**
   * Handle incoming deep link
   */
  private handleDeepLink = (event: { url: string }) => {
    const { url } = event;
    console.log('[DeepLinking] Received URL:', url);

    try {
      const { route, params } = this.parseDeepLink(url);
      this.navigate(route, params);
    } catch (error) {
      console.error('[DeepLinking] Failed to parse URL:', error);
    }
  };

  /**
   * Parse deep link URL
   * Supported formats:
   * - doit://today
   * - doit://task/123
   * - doit://stats
   * - doit://smart-assistant
   * - doit://quick-add
   */
  parseDeepLink(url: string): { route: DeepLinkRoute; params: DeepLinkParams } {
    // Remove protocol (doit://, exp+doit://, com.icare.doit://)
    let path = url.replace(/^(doit|exp\+doit|com\.icare\.doit):\/\//i, '');

    // Remove query string for parsing
    const [pathOnly, queryString] = path.split('?');
    path = pathOnly;

    // Parse route and params
    const segments = path.split('/').filter(Boolean);
    const route = segments[0] as DeepLinkRoute;
    const params: DeepLinkParams = {};

    // Handle specific routes
    switch (route) {
      case 'task':
        if (segments[1]) {
          params.taskId = segments[1];
        }
        break;

      case 'today':
      case 'stats':
      case 'smart-assistant':
      case 'quick-add':
        // No additional params needed
        break;

      default:
        throw new Error(`Unknown deep link route: ${route}`);
    }

    // Parse query string if present
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      urlParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    return { route, params };
  }

  /**
   * Navigate to the specified route
   */
  private navigate(route: DeepLinkRoute, params: DeepLinkParams) {
    if (!this.navigationRef) {
      console.warn('[DeepLinking] Navigation ref not initialized');
      return;
    }

    if (!this.navigationRef.isReady()) {
      // Wait for navigation to be ready
      setTimeout(() => this.navigate(route, params), 100);
      return;
    }

    console.log('[DeepLinking] Navigating to:', route, params);

    try {
      switch (route) {
        case 'today':
          this.navigationRef.navigate('Home', {
            screen: 'TaskList',
            params: { filter: 'today' }
          });
          break;

        case 'task':
          if (params.taskId) {
            this.navigationRef.navigate('TaskDetails', {
              taskId: params.taskId
            });
          }
          break;

        case 'stats':
          this.navigationRef.navigate('Stats');
          break;

        case 'smart-assistant':
          this.navigationRef.navigate('SmartAssistant');
          break;

        case 'quick-add':
          this.navigationRef.navigate('TaskCreate');
          break;

        default:
          console.warn('[DeepLinking] Unknown route:', route);
      }
    } catch (error) {
      console.error('[DeepLinking] Navigation failed:', error);
    }
  }

  /**
   * Generate a deep link URL
   */
  static createDeepLink(route: DeepLinkRoute, params?: DeepLinkParams): string {
    let url = `doit://${route}`;

    // Add path parameters
    if (route === 'task' && params?.taskId) {
      url += `/${params.taskId}`;
    }

    // Add query parameters
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (key !== 'taskId' && value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  /**
   * Open a deep link programmatically
   */
  static async openDeepLink(route: DeepLinkRoute, params?: DeepLinkParams): Promise<boolean> {
    const url = this.createDeepLink(route, params);

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[DeepLinking] Failed to open URL:', error);
      return false;
    }
  }
}

export const deepLinkingService = new DeepLinkingService();
export default deepLinkingService;
