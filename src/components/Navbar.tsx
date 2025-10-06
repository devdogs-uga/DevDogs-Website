import * as NavigationMenu from "@radix-ui/react-navigation-menu"; 

export default function Navbar() {
    return (
        <NavigationMenu.Root className="sticky top-0 z-50 w-full">
            <NavigationMenu.List className="center m-0 p-7 flex justify-center gap-5 list-none bg-gradient-to-r from-punchy-pink to-[#e4002b]">
                <NavigationMenu.Item>
                    <NavigationMenu.Link href="/" className="p-4 text-md font-display font-bold text-white bg-none hover:bg-white/20 rounded-lg transition-all ease-in-out duration-200">
                        Home
                    </NavigationMenu.Link>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <NavigationMenu.Link href="/" className="p-4 text-md font-display font-bold text-white bg-none hover:bg-white/20 rounded-lg transition-all ease-in-out duration-200">
                        About
                    </NavigationMenu.Link>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <NavigationMenu.Link href="/" className="p-4 text-md font-display font-bold text-white bg-none hover:bg-white/20 rounded-lg transition-all ease-in-out duration-200">
                        Team
                    </NavigationMenu.Link>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <NavigationMenu.Link href="/" className="p-4 text-md font-display font-bold text-white bg-none hover:bg-white/20 rounded-lg transition-all ease-in-out duration-200">
                        Projects
                    </NavigationMenu.Link>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <NavigationMenu.Link href="/" className="p-4 text-md font-display font-bold text-white bg-none hover:bg-white/20 rounded-lg transition-all ease-in-out duration-200">
                        Events
                    </NavigationMenu.Link>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <NavigationMenu.Link href="/" className="p-4 text-md font-display font-bold text-white bg-none hover:bg-white/20 rounded-lg transition-all ease-in-out duration-200">
                        Join Us
                    </NavigationMenu.Link>
                </NavigationMenu.Item>
            </NavigationMenu.List>
        </NavigationMenu.Root>
    ); 
}