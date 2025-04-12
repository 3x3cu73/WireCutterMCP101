import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Navigation({ activity }) {
    const navigation = [
        { name: 'Dashboard', href: '/', current: activity[0] },
        { name: 'Team', href: '/Team', current: activity[1] },
        { name: 'Projects', href: '#', current: activity[2] },
        { name: 'Calendar', href: '#', current: activity[3] },
    ]

    return (
        <>
        <div className="sticky top-0 z-50 m-2  ">

        <Disclosure as="nav" className=" border-b-2 border-blue-700 m-2 border-4 rounded-xl  bg-blue/40 backdrop-blur-lg  rounded-bl-3xl rounded-br-3xl">

            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    {/* ... rest of the mobile menu button ... */}
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-blue-500 hover:bg-blue-100 hover:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none">
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                            <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                        </DisclosureButton>
                    </div>

                    {/* ... rest of the logo and desktop navigation ... */}
                    <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="flex shrink-0 items-center">
                            <img
                                alt="Sumit Kumar Saw"
                                src="/iitd.png" // Make sure this path is correct relative to your public folder
                                className="h-8 w-auto"
                            />
                        </div>
                        <div className="hidden sm:ml-6 sm:block">
                            <div className="flex space-x-4">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        aria-current={item.current ? 'page' : undefined}
                                        className={classNames(
                                            item.current
                                                ? 'bg-blue-300 text-blue-700' // Current item style
                                                : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700', // Non-current item style (adjusted for contrast)
                                            'rounded-md px-3 py-2 text-sm font-medium',
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ... rest of the notification bell and profile dropdown ... */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        <button
                            type="button"
                            // Adjusted button style for better visibility on semi-transparent bg
                            className="relative rounded-full bg-white/50 p-1 text-blue-500 hover:text-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none"
                        >
                            <span className="sr-only">View notifications</span>
                            <BellIcon aria-hidden="true" className="size-6" />
                        </button>

                        {/* Profile dropdown */}
                        <Menu as="div" className="relative ml-3">
                            <div>
                                <MenuButton className="relative flex rounded-full bg-white text-sm focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none">
                                    <span className="sr-only">Open user menu</span>
                                    <img
                                        alt=""
                                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                        className="size-8 rounded-full"
                                    />
                                </MenuButton>
                            </div>
                            {/* Adjusted MenuItems background for better contrast */}
                            <MenuItems
                                transition // Added transition for smoother appearance
                                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in" // Tailwind UI transition classes
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
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">
                                        Sign out
                                    </a>
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Panel - Also apply background opacity and blur */}
            {/* ---- MODIFIED LINE ---- */}
            <DisclosurePanel className="sm:hidden bg-blue-50/95 backdrop-blur-sm rounded-b-lg -mt-1 pt-1">
                {/* Added matching bg opacity/blur, rounded bottom corners, negative margin + padding top to align better */}
                <div className="space-y-1 px-2 pt-2 pb-3">
                    {navigation.map((item) => (
                        <DisclosureButton
                            key={item.name}
                            as={Link} // Use Link for routing here too
                            to={item.href} // Use 'to' instead of 'href' for Link
                            aria-current={item.current ? 'page' : undefined}
                            className={classNames(
                                item.current
                                    ? 'bg-blue-200 text-blue-700'
                                    : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700', // Adjusted non-current style
                                'block rounded-md px-3 py-2 text-base font-medium',
                            )}
                        >
                            {item.name}
                        </DisclosureButton>
                    ))}
                </div>
            </DisclosurePanel>

        </Disclosure>
            {/*<div className=" bg-blue/40 backdrop-blur-lg  rounded-bl-3xl rounded-br-3xl">*/}

            {/*</div>*/}
        </div>

            </>
    )
}