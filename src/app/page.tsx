"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export default function Home() {
  const tasks = useQuery(api.webCrawler.tasks.getRoot);
  const registerTask = useMutation(api.webCrawler.tasks.registerTask);
  const [url, setUrl] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const pages = useQuery(api.webCrawler.pages.getByDomain, { domain: domainFilter });
  return (
    <main className="flex flex-col space-y-4 p-24">
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
      <Input
      placeholder="https://convex.dev"
      onChange={(e) => setUrl(e.target.value)}
      value={url}
      />
      <Button
      onClick={() => {
        if (!url) return;
        registerTask({ url });
        setUrl("");
      }}
      >Add URL</Button>
      <Table>
        <TableBody>
          {tasks && tasks.map((task: { url: string, _id: string}) => 
           <TableRow key={task._id}>
              <TableCell>{task.url}</TableCell>
            </TableRow>
)}
        </TableBody>
      </Table>
      </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Fetched</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
          placeholder="Filter by domain"
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          />
          <Table>
            <TableBody>
            {pages && pages.map((page: { url: string, _id: string }) => 
              <TableRow key={page._id}>
                <TableCell>{page.url}</TableCell>
              </TableRow>
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
