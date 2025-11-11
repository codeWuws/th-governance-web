export default {
    plugins: {
        'postcss-preset-env': {
            stage: 1,
            features: {
                'nesting-rules': true,
                'custom-properties': true,
                'custom-media-queries': true,
            },
        },
        autoprefixer: {
            overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead', 'not ie 11'],
        },
    },
}
