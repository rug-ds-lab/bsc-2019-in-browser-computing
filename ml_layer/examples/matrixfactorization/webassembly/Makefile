

compile:
	em++ --bind -std=c++17 -s BUILD_AS_WORKER=1 -s FILESYSTEM=0 -s ASSERTIONS=1 -O3 -s ALLOW_MEMORY_GROWTH=1 --post-js module-post.js -o ../../../dist/wasm.js mf_wasm.cpp
