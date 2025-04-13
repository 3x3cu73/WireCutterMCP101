import React from 'react'; // Import React explicitly if needed (often implicit now)
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

// Define navigation items outside component if they don't depend on props/state
// Or keep inside if they depend on `activity` prop initialization
// const staticNavigation = [
//     { name: 'Dashboard', href: '/', current: false }, // Current status will be set dynamically
//     { name: 'Team', href: '/Team', current: false },
//     { name: 'Projects', href: '#', current: false },
//     { name: 'Calendar', href: '#', current: false },
// ];

export default function Navigation({ activity = [true, false, false, false] }) { // Provide default activity
    // Map activity prop to navigation items
    const navigation = [
        { name: 'Dashboard', href: '/', current: activity[0] },
        { name: 'Team', href: '/Team', current: activity[1] },
        { name: 'Projects', href: '#', current: activity[2] }, // Consider actual paths or disabling if not implemented
        { name: 'Calendar', href: '#', current: activity[3] }, // Consider actual paths or disabling if not implemented
    ];

    return (
        // Sticky container with margin for spacing
        <div className="sticky top-0 z-50 p-2">
            {/* --- MODIFIED: Navbar Styling --- */}
            <Disclosure as="nav" className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-md border border-gray-200/80">
                {({ open }) => ( // Access disclosure state if needed
                    <>
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="relative flex h-16 items-center justify-between">
                                {/* Mobile menu button */}
                                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                                    <DisclosureButton className="group relative inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100/50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                                        <span className="sr-only">Open main menu</span>
                                        <Bars3Icon aria-hidden="true" className={classNames(open ? 'hidden' : 'block', 'size-6 group-data-[open]:hidden')} />
                                        <XMarkIcon aria-hidden="true" className={classNames(open ? 'block' : 'hidden', 'size-6 group-data-[open]:block')} />
                                    </DisclosureButton>
                                </div>

                                {/* Logo and Desktop Navigation */}
                                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                                    {/* Logo */}
                                    <div className="flex shrink-0 items-center">
                                        <img
                                            alt="Company Logo" // More descriptive alt text
                                            src="/iitd.png" // Ensure this path is correct
                                            className="h-8 w-auto"
                                        />
                                        {/* Optional: Text Logo for smaller screens if image hidden */}
                                        {/* <span className="ml-2 text-lg font-semibold text-gray-800 lg:hidden">Logo</span> */}
                                    </div>
                                    {/* Desktop Links */}
                                    <div className="hidden sm:ml-6 sm:block">
                                        <div className="flex space-x-4">
                                            {navigation.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    to={item.href}
                                                    aria-current={item.current ? 'page' : undefined}
                                                    className={classNames(
                                                        item.current
                                                            ? 'bg-blue-600 text-white shadow-sm' // Active link style
                                                            : 'text-gray-700 hover:bg-blue-500/10 hover:text-gray-900', // Inactive link style
                                                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ease-in-out'
                                                    )}
                                                >
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right side icons: Notification and Profile */}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                                    <button
                                        type="button"
                                        // --- MODIFIED: Button Style ---
                                        className="relative rounded-full bg-white/40 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100/50 transition-colors"
                                    >
                                        <span className="sr-only">View notifications</span>
                                        <BellIcon aria-hidden="true" className="size-6" />
                                    </button>

                                    {/* Profile dropdown */}
                                    <Menu as="div" className="relative ml-3">
                                        <div>
                                            <MenuButton className="relative flex rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100/50">
                                                <span className="sr-only">Open user menu</span>
                                                <img
                                                    alt="User avatar" // More descriptive alt text
                                                    src="/sarkar_ori.jpeg"
                                                    className="size-8 rounded-full"
                                                />
                                            </MenuButton>
                                        </div>
                                        {/* --- MODIFIED: MenuItems Style --- */}
                                        <MenuItems
                                            transition
                                            className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in" // Added rounded-xl
                                        >
                                            <MenuItem>
                                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">
                                                    Your Profile
                                                </a>
                                            </MenuItem>
                                            <MenuItem>
                                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">
                                                    Settings
                                                </a>
                                            </MenuItem>
                                            <MenuItem>
                                                {/* Consider using a button or Link for sign out if it triggers an action/route */}
                                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">
                                                    Sign out
                                                </a>
                                            </MenuItem>
                                        </MenuItems>
                                    </Menu>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu Panel */}
                        {/* --- MODIFIED: Panel Styling --- */}
                        <DisclosurePanel className="sm:hidden bg-white/85 backdrop-blur-lg rounded-b-2xl border-t border-gray-200/80 -mt-[1px] pt-1 pb-3 shadow-lg">
                            {/* Use slightly more opaque bg for readability, match rounding, overlap border, add shadow */}
                            <div className="space-y-1 px-2 pt-2 pb-1"> {/* Reduced bottom padding slightly */}
                                {navigation.map((item) => (
                                    <DisclosureButton
                                        key={item.name}
                                        as={Link} // Use Link for routing
                                        to={item.href}
                                        aria-current={item.current ? 'page' : undefined}
                                        className={classNames(
                                            item.current
                                                ? 'bg-blue-100 text-blue-700' // Mobile active style
                                                : 'text-gray-700 hover:bg-gray-500/10 hover:text-gray-900', // Mobile inactive style
                                            'block rounded-lg px-3 py-2 text-base font-medium transition-colors duration-150 ease-in-out'
                                        )}
                                    >
                                        {item.name}
                                    </DisclosureButton>
                                ))}
                            </div>
                        </DisclosurePanel>
                    </>
                )}
            </Disclosure>
        </div>
    );
}