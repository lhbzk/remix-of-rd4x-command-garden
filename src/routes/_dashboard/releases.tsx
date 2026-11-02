import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bug,
  Calendar,
  Download,
  Eye,
  Hash,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  Tag,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/dashboard/Modal";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/dashboard/States";

import {
  createRelease,
  currentAdmin,
  getDiscordChannels,
} from "@/lib/api";
import { queries } from "@/lib/api/queries";
import type {
  DiscordChannel,
  Release,
  ReleaseChannel,
} from "@/lib/api/types";

import {
  formatCompact,
  formatDate,
  timeAgo,
} from "@/lib/format";

import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/releases")({
  head: () =>
    pageHead(
      "Releases",
      "Version history, changelogs and publishing for RD4X releases.",
    ),
  component: ReleasesPage,
});

const CHANGE_ICON = {
  feature: Sparkles,
  fix: Bug,
  improvement: Wrench,
};

const CHANGE_CLS = {
  feature: "text-primary",
  fix: "text-danger",
  improvement: "text-info",
};

function ReleasesPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery(queries.releases());

  const [open, setOpen] = useState(false);

  const stable = data?.find((r) => r.channel !== "beta");
  const latest = data?.[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Releases"
        description="Ship and track every RD4X client version."
        actions={
          <Button
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-4" />
            New release
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          loading={isLoading}
          label="Current version"
          icon={Tag}
          value={
            stable && (
              <span className="font-mono">
                v{stable.version}
              </span>
            )
          }
          hint={stable?.channel}
        />

        <StatCard
          loading={isLoading}
          label="Last release"
          icon={Calendar}
          value={
            latest && timeAgo(latest.date)
          }
          hint={
            latest && formatDate(latest.date)
          }
        />

        <StatCard
          loading={isLoading}
          label="Total releases"
          icon={Package}
          value={data?.length}
          hint="since V10"
        />

        <StatCard
          loading={isLoading}
          label="Downloads"
          icon={Download}
          value={
            data &&
            formatCompact(
              data.reduce(
                (sum, release) =>
                  sum + release.downloads,
                0,
              ),
            )
          }
          delta={11.3}
        />
      </div>

      {isError ? (
        <ErrorState
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingSkeleton
          variant="cards"
          count={4}
        />
      ) : !data?.length ? (
        <EmptyState
          icon={Rocket}
          title="No releases yet"
          description="Publish your first version to start the timeline."
          action={
            <Button
              size="sm"
              onClick={() => setOpen(true)}
            >
              New release
            </Button>
          }
        />
      ) : (
        <ol className="relative space-y-4 pl-6 sm:pl-8">
          <span className="absolute bottom-2 left-[7px] top-2 w-px bg-border sm:left-[11px]" />

          {data.map((release, index) => (
            <li
              key={release.id}
              className="relative fade-up"
              style={{
                animationDelay: `${index * 40}ms`,
              }}
            >
              <span
                className={cn(
                  "absolute -left-6 top-5 size-[15px] rounded-full border-[3px] border-background sm:-left-8 sm:size-[23px] sm:border-[6px]",
                  index === 0
                    ? "bg-primary"
                    : "bg-muted-foreground/40",
                )}
              />

              <ReleaseCard
                release={release}
                latest={index === 0}
              />
            </li>
          ))}
        </ol>
      )}

      <CreateReleaseModal
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

function ReleaseCard({
  release: r,
  latest,
}: {
  release: Release;
  latest: boolean;
}) {
  return (
    <article
      className={cn(
        "surface-card p-4 sm:p-5",
        latest && "glow-primary",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-mono text-base font-semibold">
              v{r.version}
            </h3>

            <StatusBadge
              value={r.channel}
              dot={false}
            />

            {latest && (
              <StatusBadge
                value="latest"
                tone="primary"
                pulse
              >
                Latest
              </StatusBadge>
            )}

            {r.publishedToDiscord && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <MessageSquare className="size-3" />
                Discord
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-foreground/90">
            {r.title}
          </p>

          {r.discordChannelId && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hash className="size-3.5" />
              Discord channel connected
            </p>
          )}
        </div>

        <div className="text-right text-xs text-muted-foreground">
          <p>{formatDate(r.date)}</p>

          <p className="mt-0.5">
            by @{r.author} ·{" "}
            {formatCompact(r.downloads)} downloads
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-border pt-4">
        {r.changes.map((change, index) => {
          const Icon = CHANGE_ICON[change.type];

          return (
            <li
              key={index}
              className="flex items-start gap-2.5 text-sm"
            >
              <Icon
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  CHANGE_CLS[change.type],
                )}
              />

              <span className="text-muted-foreground">
                <span className="mr-1.5 font-mono text-[11px] uppercase text-foreground/70">
                  {change.type}
                </span>

                {change.text}
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function CreateReleaseModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [channel, setChannel] =
    useState<ReleaseChannel>("stable");

  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [discordChannelId, setDiscordChannelId] =
    useState("");

  const [publishToDiscord, setPublishToDiscord] =
    useState(false);

  const {
    data: discordChannels,
    isLoading: channelsLoading,
    isFetching: channelsFetching,
    refetch: refetchChannels,
  } = useQuery(queries.discordChannels());

  const availableChannels = useMemo(
    () =>
      (discordChannels ?? []).filter(
        (discordChannel) =>
          discordChannel.canSendMessages,
      ),
    [discordChannels],
  );

  const selectedDiscordChannel =
    availableChannels.find(
      (discordChannel) =>
        discordChannel.id ===
        discordChannelId,
    );

  const validVersion =
    /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(
      version.trim(),
    );

  const validTitle =
    title.trim().length > 2;

  const validDiscordPublication =
    !publishToDiscord ||
    Boolean(selectedDiscordChannel);

  const valid =
    validVersion &&
    validTitle &&
    validDiscordPublication &&
    !mutationIsImpossible({
      publishToDiscord,
      channels: availableChannels,
    });

  const mutation = useMutation({
    mutationFn: createRelease,

    onSuccess: (release) => {
      queryClient.setQueryData<Release[]>(
        queries.releases().queryKey,
        (old) => [
          release,
          ...(old ?? []),
        ],
      );

      if (
        publishToDiscord &&
        selectedDiscordChannel
      ) {
        notify.success(
          `v${release.version} published`,
          `Release created and sent to #${selectedDiscordChannel.name}.`,
        );
      } else {
        notify.success(
          `v${release.version} published`,
          `Release published successfully.`,
        );
      }

      onOpenChange(false);

      resetForm();
    },

    onError: () => {
      notify.error(
        "Couldn't publish release",
        "The RD4X API rejected the request.",
      );
    },
  });

  function resetForm() {
    setVersion("");
    setTitle("");
    setChannel("stable");
    setNotes("");
    setImageUrl("");
    setDiscordChannelId("");
    setPublishToDiscord(false);
  }

  const submit = () => {
    if (!valid || mutation.isPending) {
      return;
    }

    const changes = notes
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(
          /^(fix|feature|improvement):\s*(.+)$/i,
        );

        if (match) {
          return {
            type: match[1]!.toLowerCase() as
              | "fix"
              | "feature"
              | "improvement",
            text: match[2]!,
          };
        }

        return {
          type: "improvement" as const,
          text: line,
        };
      });

    mutation.mutate({
      version: version.trim(),
      title: title.trim(),
      channel,
      author: currentAdmin.username,
      changes,

      discordChannelId:
        publishToDiscord
          ? discordChannelId
          : null,

      publishedToDiscord:
        publishToDiscord,

      discordMessageId: null,

      ...(imageUrl.trim()
        ? {
            imageUrl: imageUrl.trim(),
          }
        : {}),
    } as Omit<
      Release,
      "id" | "date" | "downloads"
    >);
  };

  const toggleDiscord = (
    checked: boolean,
  ) => {
    setPublishToDiscord(checked);

    if (
      checked &&
      !discordChannelId &&
      availableChannels.length === 1
    ) {
      setDiscordChannelId(
        availableChannels[0]!.id,
      );
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create release"
      description="Publish a new RD4X client version and optionally announce it through Discord."
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>

          <Button
            size="sm"
            disabled={
              !valid ||
              mutation.isPending
            }
            onClick={submit}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Rocket className="size-4" />
            )}

            Publish release
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        {/* Version / channel */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="rel-version">
              Version
            </Label>

            <Input
              id="rel-version"
              className="font-mono"
              placeholder="10.3.0"
              value={version}
              onChange={(event) =>
                setVersion(
                  event.target.value,
                )
              }
            />

            {version.length > 0 &&
              !validVersion && (
                <p className="text-[11px] text-danger">
                  Use a version such as 10.3.0
                </p>
              )}
          </div>

          <div className="grid gap-1.5">
            <Label>Channel</Label>

            <Select
              value={channel}
              onValueChange={(value) =>
                setChannel(
                  value as ReleaseChannel,
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="stable">
                  Stable
                </SelectItem>

                <SelectItem value="beta">
                  Beta
                </SelectItem>

                <SelectItem value="hotfix">
                  Hotfix
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Title */}
        <div className="grid gap-1.5">
          <Label htmlFor="rel-title">
            Title
          </Label>

          <Input
            id="rel-title"
            placeholder="What's in this release?"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
          />
        </div>

        {/* Changelog */}
        <div className="grid gap-1.5">
          <Label htmlFor="rel-notes">
            Changelog
          </Label>

          <Textarea
            id="rel-notes"
            rows={5}
            className="font-mono text-xs"
            placeholder={
              "feature: New script hub\nfix: Crash on startup\nimprovement: Faster cold start"
            }
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value,
              )
            }
          />

          <p className="text-[11px] text-muted-foreground">
            One change per line. Prefix with
            {" "}
            <span className="font-mono">
              feature:
            </span>
            ,{" "}
            <span className="font-mono">
              fix:
            </span>
            {" "}or{" "}
            <span className="font-mono">
              improvement:
            </span>
          </p>
        </div>

        {/* Image */}
        <div className="grid gap-1.5">
          <Label htmlFor="rel-image">
            Release image / banner
          </Label>

          <div className="relative">
            <ImageIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="rel-image"
              className="pl-9"
              placeholder="https://..."
              value={imageUrl}
              onChange={(event) =>
                setImageUrl(
                  event.target.value,
                )
              }
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Optional image used by the Discord
            announcement.
          </p>
        </div>

        {/* Discord publication */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <input
              id="publish-discord"
              type="checkbox"
              checked={publishToDiscord}
              onChange={(event) =>
                toggleDiscord(
                  event.target.checked,
                )
              }
              className="mt-1 size-4 accent-primary"
            />

            <div className="min-w-0 flex-1">
              <Label
                htmlFor="publish-discord"
                className="cursor-pointer"
              >
                Announce on Discord
              </Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Send the release announcement
                through the RD4X bot after
                publishing.
              </p>
            </div>

            <MessageSquare className="size-5 shrink-0 text-primary" />
          </div>

          {publishToDiscord && (
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <Label>
                  Discord channel
                </Label>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() =>
                    refetchChannels()
                  }
                  disabled={
                    channelsLoading ||
                    channelsFetching
                  }
                >
                  <RefreshCw
                    className={cn(
                      "size-3.5",
                      channelsFetching &&
                        "animate-spin",
                    )}
                  />
                  Refresh
                </Button>
              </div>

              {channelsLoading ? (
                <div className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading Discord channels...
                </div>
              ) : availableChannels.length ===
                0 ? (
                <div className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                  <div className="flex items-start gap-2">
                    <Hash className="mt-0.5 size-4 shrink-0 text-danger" />

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        No available channels
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        The RD4X bot has not returned
                        any channel where it can send
                        messages yet.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Select
                    value={discordChannelId}
                    onValueChange={
                      setDiscordChannelId
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Discord channel" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableChannels.map(
                        (
                          discordChannel: DiscordChannel,
                        ) => (
                          <SelectItem
                            key={
                              discordChannel.id
                            }
                            value={
                              discordChannel.id
                            }
                          >
                            <span className="flex items-center gap-2">
                              <Hash className="size-3.5 text-muted-foreground" />

                              <span>
                                {discordChannel.category
                                  ? `${discordChannel.category} / `
                                  : ""}
                                {discordChannel.name}
                              </span>
                            </span>
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>

                  {selectedDiscordChannel && (
                    <p className="text-[11px] text-muted-foreground">
                      Bot can send messages in #
                      {selectedDiscordChannel.name}.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-primary" />

              <span className="text-xs font-medium">
                Announcement preview
              </span>
            </div>

            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Discord
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/15">
                <Rocket className="size-3.5 text-primary" />
              </div>

              <div>
                <p className="text-xs font-semibold">
                  RD4X
                </p>

                <p className="text-[10px] text-muted-foreground">
                  Release announcement
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="font-semibold">
                {title.trim() ||
                  "New RD4X release"}
              </p>

              <p className="mt-1 font-mono text-xs text-primary">
                v{version.trim() || "10.3.0"}
              </p>

              {notes.trim() && (
                <p className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">
                  {notes.trim()}
                </p>
              )}

              {imageUrl.trim() && (
                <div className="mt-3 overflow-hidden rounded-md border border-border">
                  <img
                    src={imageUrl.trim()}
                    alt="Release preview"
                    className="max-h-48 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function mutationIsImpossible({
  publishToDiscord,
  channels,
}: {
  publishToDiscord: boolean;
  channels: DiscordChannel[];
}) {
  return (
    publishToDiscord &&
    channels.length === 0
  );
    }
