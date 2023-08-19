subinclude("///pleasings//docker")
subinclude ("//common/lint_dotnet")

sh_cmd(
  name = "compose",
  cmd = "cat svc/parser/docker-compose.yml | sed 's/\\\${PROJECT}/${PROJECT}/g' | docker compose --project-name \${PROJECT} -f - \\\$@",
)

docker_image(
    name="parser",
    srcs = glob(["*"], ["bin", "obj", "dist"]),
    dockerfile = "Dockerfile",
    visibility = ["//svc/parser/..."]
)

gentest(
  name = "test",
  test_cmd = "echo todo",
  no_test_output = True
)

lint(package = "//svc/parser")
lint_fix(package = "//svc/parser")
