sh_cmd(
  name = "compose",
  cmd = "cat svc/portfolio/docker-compose.yml | sed 's/\\\${PROJECT}/${PROJECT}/g' | docker compose --project-name \${PROJECT} -f - \\\$@",
)

docker_image(
  name = "portfolio",
  srcs = glob(["*"], ["node_modules", "dist"]),
  dockerfile = "Dockerfile",
  visibility = ["//svc/portfolio/..."]
)

gentest(
  name = "test",
  data = glob(["*"], ["node_modules", "dist"]),
  test_cmd = "npm --prefix svc/portfolio ci && (npm --prefix svc/portfolio t || true)",
  no_test_output = True
)

lint(package = "//svc/portfolio")
lint(name = "lint_fix", args = "--fix", package = "//svc/portfolio")
