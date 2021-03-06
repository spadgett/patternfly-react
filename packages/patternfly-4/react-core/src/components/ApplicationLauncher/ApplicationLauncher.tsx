import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/AppLauncher/app-launcher';
import formStyles from '@patternfly/react-styles/css/components/FormControl/form-control';
import { ThIcon } from '@patternfly/react-icons';
import { DropdownDirection, DropdownPosition, DropdownToggle, DropdownContext } from '../Dropdown';
import { DropdownWithContext } from '../Dropdown/DropdownWithContext';
import { ApplicationLauncherGroup } from './ApplicationLauncherGroup';
import { ApplicationLauncherSeparator } from './ApplicationLauncherSeparator';
import { ApplicationLauncherItem } from './ApplicationLauncherItem';

export interface ApplicationLauncherProps extends React.HTMLProps<HTMLDivElement> {
  /** Additional element css classes */
  className?: string;
  /** Display menu above or below dropdown toggle */
  direction?: DropdownDirection;
  /**
   * @deprecated
   * Use the items prop instead
   *
   * Array of DropdownItem nodes that will be rendered in the dropdown Menu list
   */
  dropdownItems?: React.ReactNode[];
  /** Array of application launcher items */
  items?: React.ReactNode[];
  /** Render Application launcher toggle as disabled icon */
  isDisabled?: boolean;
  /** open bool */
  isOpen?: boolean;
  /** Indicates where menu will be alligned horizontally */
  position?: DropdownPosition;
  /** Function callback called when user selects item */
  onSelect?: (event: any) => void;
  /** Callback called when application launcher toggle is clicked */
  onToggle?: (value: boolean) => void;
  /** Adds accessible text to the button. Required for plain buttons */
  'aria-label'?: string;
  /** Flag to indicate if application launcher has groups */
  isGrouped?: boolean;
  /** Toggle Icon, optional to override the icon used for the toggle */
  toggleIcon?: React.ReactNode;
  /** ID list of favorited ApplicationLauncherItems */
  favorites?: string[];
  /** Enables favorites. Callback called when an ApplicationLauncherItem's favorite button is clicked */
  onFavorite?(itemId: string, isFavorite: boolean): void;
  /** Enables search. Callback called when text input is entered into search box */
  onSearch?(textInput: string): void;
  /** Placeholder text for search input */
  searchPlaceholderText?: string;
  /** Text for search input when no results are found */
  searchNoResultsText?: string;
  /** Additional properties for search input */
  searchProps?: any;
  /** Label for the favorites group */
  favoritesLabel?: string;
  /** ID of toggle */
  toggleId?: string;
}

export const ApplicationLauncherContext = React.createContext({ onFavorite: Function.prototype });

export class ApplicationLauncher extends React.Component<ApplicationLauncherProps> {
  static defaultProps = {
    className: '',
    isDisabled: false,
    direction: DropdownDirection.down,
    dropdownItems: [] as React.ReactNode[],
    favorites: [] as string[],
    items: [] as React.ReactNode[],
    isOpen: false,
    position: DropdownPosition.left,
    onSelect: (_event: any): any => undefined,
    onToggle: (_value: boolean): any => undefined,
    'aria-label': 'Application launcher',
    isGrouped: false,
    toggleIcon: <ThIcon />,
    searchPlaceholderText: 'Filter by name...',
    searchNoResultsText: 'No results found',
    favoritesLabel: 'Favorites'
  };

  createSearchBox = () => {
    const { onSearch, searchPlaceholderText, searchProps } = this.props;

    return (
      <div key="search" className={css(styles.appLauncherMenuSearch)}>
        <ApplicationLauncherItem
          customChild={
            <input
              type="search"
              className={css(formStyles.formControl)}
              placeholder={searchPlaceholderText}
              onChange={e => onSearch(e.target.value)}
              {...searchProps}
            ></input>
          }
        ></ApplicationLauncherItem>
      </div>
    );
  };

  createRenderableFavorites = () => {
    const { items, isGrouped, favorites } = this.props;
    if (isGrouped) {
      let favoriteItems: React.ReactNode[] = [];
      (items as React.ReactElement[]).forEach(group =>
        (group.props.children as React.ReactElement[])
          .filter(item => favorites.includes(item.props.id))
          .map(item => favoriteItems.push(React.cloneElement(item, { isFavorite: true, enterTriggersArrowDown: true })))
      );
      return favoriteItems;
    }
    return (items as React.ReactElement[])
      .filter(item => favorites.includes(item.props.id))
      .map(item => React.cloneElement(item, { isFavorite: true, enterTriggersArrowDown: true }));
  };

  extendItemsWithFavorite = () => {
    const { items, isGrouped, favorites } = this.props;
    if (isGrouped) {
      return (items as React.ReactElement[]).map(group =>
        React.cloneElement(group, {
          children: React.Children.map(group.props.children as React.ReactElement[], item => {
            if (item.type === ApplicationLauncherSeparator) return item;
            return React.cloneElement(item, {
              isFavorite: favorites.some(favoriteId => favoriteId === item.props.id)
            });
          })
        })
      );
    }
    return (items as React.ReactElement[]).map(item =>
      React.cloneElement(item, {
        isFavorite: favorites.some(favoriteId => favoriteId === item.props.id)
      })
    );
  };

  render() {
    const {
      'aria-label': ariaLabel,
      isOpen,
      onToggle,
      toggleIcon,
      toggleId,
      onSelect,
      isDisabled,
      className,
      isGrouped,
      dropdownItems,
      favorites,
      onFavorite,
      onSearch,
      searchPlaceholderText,
      searchProps,
      items,
      ref,
      favoritesLabel,
      searchNoResultsText,
      ...props
    } = this.props;
    let renderableItems: React.ReactNode[] = [];

    if (onFavorite) {
      let favoritesGroup: React.ReactNode[] = [];
      let renderableFavorites: React.ReactNode[] = [];
      if (favorites.length > 0) {
        renderableFavorites = this.createRenderableFavorites();
        favoritesGroup = [
          <ApplicationLauncherGroup key="favorites" label={favoritesLabel}>
            {renderableFavorites}
            <ApplicationLauncherSeparator key="separator" />
          </ApplicationLauncherGroup>
        ];
      }
      if (renderableFavorites.length > 0) renderableItems = favoritesGroup.concat(this.extendItemsWithFavorite());
      else renderableItems = this.extendItemsWithFavorite();
    } else {
      renderableItems = items;
    }
    if (items.length === 0 && dropdownItems.length === 0) {
      renderableItems = [
        <ApplicationLauncherGroup key="no-results-group">
          <ApplicationLauncherItem key="no-results">{searchNoResultsText}</ApplicationLauncherItem>
        </ApplicationLauncherGroup>
      ];
    }
    if (onSearch) {
      renderableItems = [this.createSearchBox(), ...renderableItems];
    }

    return (
      <ApplicationLauncherContext.Provider value={{ onFavorite }}>
        <DropdownContext.Provider
          value={{
            onSelect,
            menuClass: styles.appLauncherMenu,
            itemClass: styles.appLauncherMenuItem,
            toggleClass: styles.appLauncherToggle,
            baseClass: styles.appLauncher,
            baseComponent: 'nav',
            sectionClass: styles.appLauncherGroup,
            sectionTitleClass: styles.appLauncherGroupTitle,
            sectionComponent: 'section',
            disabledClass: styles.modifiers.disabled,
            hoverClass: styles.modifiers.hover,
            separatorClass: styles.appLauncherSeparator
          }}
        >
          <DropdownWithContext
            {...props}
            dropdownItems={renderableItems.length ? renderableItems : dropdownItems}
            isOpen={isOpen}
            className={className}
            aria-label={ariaLabel}
            toggle={
              <DropdownToggle
                id={toggleId}
                iconComponent={null}
                isOpen={isOpen}
                onToggle={onToggle}
                isDisabled={isDisabled}
                aria-label={ariaLabel}
              >
                {toggleIcon}
              </DropdownToggle>
            }
            isGrouped={isGrouped}
          />
        </DropdownContext.Provider>
      </ApplicationLauncherContext.Provider>
    );
  }
}
