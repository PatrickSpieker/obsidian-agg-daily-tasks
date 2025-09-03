import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        // Enable TypeScript support
        globals: true,
        environment: 'node',
        // Test file patterns
        include: ['**/*.test.ts', '**/*.spec.ts'],
        // Exclude node_modules and build outputs
        exclude: ['node_modules', 'lib', '*.js'],
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZXN0LmNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3ZpdGVzdC5jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUU3QyxlQUFlLFlBQVksQ0FBQztJQUMxQixJQUFJLEVBQUU7UUFDSiw0QkFBNEI7UUFDNUIsT0FBTyxFQUFFLElBQUk7UUFDYixXQUFXLEVBQUUsTUFBTTtRQUNuQixxQkFBcUI7UUFDckIsT0FBTyxFQUFFLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQztRQUN6Qyx5Q0FBeUM7UUFDekMsT0FBTyxFQUFFLENBQUMsY0FBYyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUM7S0FDekM7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGVzdDoge1xuICAgIC8vIEVuYWJsZSBUeXBlU2NyaXB0IHN1cHBvcnRcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnbm9kZScsXG4gICAgLy8gVGVzdCBmaWxlIHBhdHRlcm5zXG4gICAgaW5jbHVkZTogWycqKi8qLnRlc3QudHMnLCAnKiovKi5zcGVjLnRzJ10sXG4gICAgLy8gRXhjbHVkZSBub2RlX21vZHVsZXMgYW5kIGJ1aWxkIG91dHB1dHNcbiAgICBleGNsdWRlOiBbJ25vZGVfbW9kdWxlcycsICdsaWInLCAnKi5qcyddLFxuICB9LFxufSk7Il19