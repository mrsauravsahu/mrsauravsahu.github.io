ARG DOTNET_VERSION
ARG DOTNET_RUNTIME_VERSION

FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build-env

WORKDIR /app

# copy everything else and build
COPY src ./

# Publish only the service project; publishing the solution also compiles the tests.
ARG SVC
ARG ARCH=linux-musl-x64
RUN dotnet publish ${SVC}/${SVC}.csproj -c Release --self-contained -r $ARCH -o out

# build runtime image

FROM mcr.microsoft.com/dotnet/runtime-deps:${DOTNET_RUNTIME_VERSION}

WORKDIR /app

COPY --from=build-env /app/out ./

EXPOSE 80

ARG SVC
ENV SVC=${SVC}
ENTRYPOINT ./${SVC}
