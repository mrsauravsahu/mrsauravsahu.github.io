using System;
using System.Collections.Generic;
using System.IO.Abstractions;
using System.Linq;
using System.Threading.Tasks;
using mrsauravsahu.api.options;
using mrsauravsahu.services.contracts;
using mrsauravsahu.services.options;
using mrsauravsahu.services;
using mrsauravsahu.services.integrations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Propfull.AspNet.Config;
using mrsauravsahu.data.context;
using Microsoft.OpenApi.Models;
using Sieve.Services;
using mrsauravsahu.api.contracts;
using HotChocolate.Data;
using Data.Common.Utils.ConnectionString;
using Microsoft.EntityFrameworkCore;
using kDg.FileBaseContext.Extensions;
using kDg.FileBaseContext.Serializers;

namespace mrsauravsahu.api
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();

            services
                .AddMvcCore()
                .AddApiExplorer();

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "@mrsauravsahu/blogs", Version = "v1" });
            });


            services.Configure<AboutAppOptions>(Configuration.GetSection("Blogs"));
            services.AddSingleton(options => options.GetConfigService<AboutAppOptions>());

            services.Configure<GithubServiceOptions>(Configuration.GetSection("Github"));
            services.AddSingleton(options => options.GetConfigService<GithubServiceOptions>());

            services.AddSingleton<BlogsContext>((_) => new BlogsContext(Configuration.GetValue<string>("Files:BasePath")));
            // services.AddDbContext<BlogsContext>();
            // options =>
            // {
            //     options
            //     .UseFileBaseContextDatabase(Configuration.GetValue<string>("Files:BasePath"));
                
            //     // , null, services =>
            //     // {
            //     //     // if(csvRowSerializerAdded) return;
            //     //     // services.AddMockFileSystem(_fileSystem);
            //     //     // csvRowSerializerAdded = true;
            //     // });
            //     // var connectionString = new FileConnectionString() { DataSource = Configuration.GetValue<string>("Files:BasePath") };
            //     // options.UseCsv(connectionString);
            // });

            services.AddCsvRowDataSerializer();
            services.Configure<LocalFileServiceOptions>(Configuration.GetSection("Files"));
            services.AddSingleton<IFileSystem, FileSystem>();
            services.AddSingleton<LocalFileService>();

            services.AddScoped<BlogsService>();
            services.AddScoped<LinksService>();
            services.AddScoped<HighlightsService>();
            services.AddScoped<GithubService>();

            services.AddScoped<SieveProcessor>();

            // services.AddCors();

            services
                .AddGraphQLServer()
                .AddQueryType<Query>()
                .AddMutationType<Mutation>()
                .AddSorting()
                .AddDiagnosticEventListener<ErrorLoggingDiagnosticsEventListener>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();

            app.UseAuthorization();

            // var originURLs = (Environment.GetEnvironmentVariable("CORS_URLS") ?? "").Split(",");
            // app.UseCors(options => {
            //     options.WithOrigins(originURLs).AllowAnyMethod();
            // });

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapGraphQL();
            });

            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "@mrsauravsahu/blogs");
            });
        }
    }
}
