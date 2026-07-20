svc=split_path(package_name())[-1]

tarball(
  name="local_k8s",
  srcs=["//common/k8s"] + glob("k8s/values.yaml") + glob("k8s/values.local.yaml") + glob("k8s/Chart.yaml")
)

sh_cmd(
    name="local",
    deps=[":local_k8s"],
    cmd='''
    mkdir plz-out/gen/apps/{svc}/local_k8s
    tar xvf plz-out/gen/apps/{svc}/local_k8s.tar.gz --directory plz-out/gen/apps/{svc}/local_k8s
    helm upgrade --install \
      --create-namespace -n ${PROJECT_NAME}-dev \
      --set helpers.PROJECT_ROOT=${PROJECT_ROOT} \
      --values plz-out/gen/apps/{svc}/local_k8s/values.local.yaml \
      {svc} plz-out/gen/apps/{svc}/local_k8s
    rm -r plz-out/gen/apps/{svc}/local_k8s
    '''.format(svc=svc),
    srcs=[":local_k8s"],
)

# Serves the adapter-static export (apps/portfolio/build) via nginx, so the
# actual production build/prerender path can be verified locally. Run
# `npm run build` in apps/portfolio first to populate the build/ directory.
tarball(
  name="local_static_k8s",
  srcs=["//common/k8s"] + glob("k8s/values.yaml") + glob("k8s/values.local-static.yaml") + glob("k8s/Chart.yaml")
)

sh_cmd(
    name="local_static",
    deps=[":local_static_k8s"],
    cmd='''
    mkdir plz-out/gen/apps/{svc}/local_static_k8s
    tar xvf plz-out/gen/apps/{svc}/local_static_k8s.tar.gz --directory plz-out/gen/apps/{svc}/local_static_k8s
    helm upgrade --install \
      --create-namespace -n ${PROJECT_NAME}-dev \
      --set helpers.PROJECT_ROOT=${PROJECT_ROOT} \
      --values plz-out/gen/apps/{svc}/local_static_k8s/values.local-static.yaml \
      {svc}-static plz-out/gen/apps/{svc}/local_static_k8s
    rm -r plz-out/gen/apps/{svc}/local_static_k8s
    '''.format(svc=svc),
    srcs=[":local_static_k8s"],
)
