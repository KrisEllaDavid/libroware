--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BorrowStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BorrowStatus" AS ENUM (
    'BORROWED',
    'RETURNED',
    'OVERDUE'
);


ALTER TYPE public."BorrowStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'LIBRARIAN',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Author; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Author" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Author" OWNER TO postgres;

--
-- Name: Book; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Book" (
    id text NOT NULL,
    title text NOT NULL,
    isbn text NOT NULL,
    description text,
    "publishedAt" timestamp(3) without time zone NOT NULL,
    "coverImage" text,
    "pageCount" integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    available integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Book" OWNER TO postgres;

--
-- Name: Borrow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Borrow" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "bookId" text NOT NULL,
    "borrowedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    "returnedAt" timestamp(3) without time zone,
    status public."BorrowStatus" DEFAULT 'BORROWED'::public."BorrowStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Borrow" OWNER TO postgres;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "bookId" text NOT NULL,
    "userEmail" text NOT NULL,
    "userName" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Review" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "profilePicture" text,
    "requiresPasswordChange" boolean DEFAULT true
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _BookToAuthor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_BookToAuthor" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_BookToAuthor" OWNER TO postgres;

--
-- Name: _BookToCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_BookToCategory" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_BookToCategory" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Author; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Author" (id, name, "createdAt", "updatedAt") FROM stdin;
6fb8ec6c-3b89-4a8b-b969-d004c8deaddc	J.K. Rowling	2025-04-25 11:19:14.628	2025-04-25 11:19:14.628
f54628ce-e7cd-41f3-bd92-3afcef5d90b5	George Orwell	2025-04-25 11:19:14.63	2025-04-25 11:19:14.63
b2b76372-4955-4ca1-9699-be52089971c6	Stephen Hawking	2025-04-25 11:19:14.632	2025-04-25 11:19:14.632
0ae5fd4d-8032-446c-983e-2a8f5d7cc49d	Robert C. Martin	2025-04-25 11:19:14.634	2025-04-25 11:19:14.634
\.


--
-- Data for Name: Book; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Book" (id, title, isbn, description, "publishedAt", "coverImage", "pageCount", quantity, available, "createdAt", "updatedAt") FROM stdin;
f6f36ae2-34bf-4fad-af67-0457fab71c22	Harry Potter and the Philosopher's Stone	9780747532743	The first book in the Harry Potter series	1997-06-26 00:00:00	https://covers.openlibrary.org/b/id/8267078-L.jpg	223	5	3	2025-04-25 11:19:14.636	2025-04-25 11:19:14.636
a37c6718-b763-42df-9b58-fa3e266e1dc4	1984	9780451524935	A dystopian novel by George Orwell	1949-06-08 00:00:00	https://covers.openlibrary.org/b/id/8575708-L.jpg	328	10	8	2025-04-25 11:19:14.642	2025-04-25 11:19:14.642
27e54a53-bfda-4efa-9096-178756be74ab	A Brief History of Time	9780553380163	A book about cosmology by Stephen Hawking	1988-03-01 00:00:00	https://covers.openlibrary.org/b/id/8110075-L.jpg	212	3	3	2025-04-25 11:19:14.646	2025-04-25 11:19:14.646
6b13e4b7-0cd7-4317-8e77-dc1a2ae445b2	Clean Code: A Handbook of Agile Software Craftsmanship	9780132350884	A book about writing clean code by Robert C. Martin	2008-08-01 00:00:00	https://covers.openlibrary.org/b/id/8935150-L.jpg	464	2	1	2025-04-25 11:19:14.651	2025-04-25 11:19:14.651
\.


--
-- Data for Name: Borrow; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Borrow" (id, "userId", "bookId", "borrowedAt", "dueDate", "returnedAt", status, "createdAt", "updatedAt") FROM stdin;
bfca4484-0a10-4fc2-9179-e47415490853	d3029cd3-3595-4cd8-9d5c-8bbb4070af74	f6f36ae2-34bf-4fad-af67-0457fab71c22	2025-04-15 11:19:14.642	2025-04-29 11:19:14.642	\N	BORROWED	2025-04-25 11:19:14.655	2025-04-25 11:19:14.655
87879fdb-766c-4ccb-a027-3a6f6ea26405	d3029cd3-3595-4cd8-9d5c-8bbb4070af74	6b13e4b7-0cd7-4317-8e77-dc1a2ae445b2	2025-03-26 11:19:14.647	2025-04-15 11:19:14.647	2025-04-13 11:19:14.647	RETURNED	2025-04-25 11:19:14.66	2025-04-25 11:19:14.66
8cd5382e-97be-42c6-9e50-c7618bf45bd5	a27f18cc-11ce-4705-a146-6307ecabd55f	27e54a53-bfda-4efa-9096-178756be74ab	2025-03-11 11:19:14.649	2025-03-25 11:19:14.649	2025-03-24 11:19:14.649	RETURNED	2025-04-25 11:19:14.662	2025-04-25 11:19:14.662
98dacfef-b835-4403-831a-72538136f8bf	d3029cd3-3595-4cd8-9d5c-8bbb4070af74	a37c6718-b763-42df-9b58-fa3e266e1dc4	2025-02-24 11:19:14.653	2025-03-10 11:19:14.653	2025-03-11 11:19:14.653	RETURNED	2025-04-25 11:19:14.666	2025-04-25 11:19:14.666
8616b1aa-a762-4fcc-b4a9-dc7b37e5a256	765f5887-b7b0-43ab-809b-a7d439fd473a	27e54a53-bfda-4efa-9096-178756be74ab	2025-04-20 11:19:14.655	2025-05-04 11:19:14.655	\N	BORROWED	2025-04-25 11:19:14.668	2025-04-25 11:19:14.668
6e0188c5-eda2-4094-a598-a8b33404872f	a27f18cc-11ce-4705-a146-6307ecabd55f	a37c6718-b763-42df-9b58-fa3e266e1dc4	2025-04-10 11:19:14.645	2025-04-24 11:19:14.645	\N	OVERDUE	2025-04-25 11:19:14.658	2025-04-25 11:20:42.03
00cc7849-0ebd-48d2-ad6d-7fbf2e73a51b	36758b31-ec24-451e-bf56-42cdd62edaa0	f6f36ae2-34bf-4fad-af67-0457fab71c22	2025-04-05 11:19:14.65	2025-04-19 11:19:14.65	\N	OVERDUE	2025-04-25 11:19:14.664	2025-04-25 11:20:42.033
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, description, "createdAt", "updatedAt") FROM stdin;
077afedf-b2c7-43ae-b6a3-2d698680080d	Fiction	Fictional literature	2025-04-25 11:19:14.622	2025-04-25 11:19:14.622
88170501-c3b5-4eca-bb00-85796b085136	Science	Scientific books and papers	2025-04-25 11:19:14.624	2025-04-25 11:19:14.624
21844fb7-bdd2-4e0d-8605-d81c92c40c8f	History	Historical accounts and analysis	2025-04-25 11:19:14.625	2025-04-25 11:19:14.625
bf06ce9c-2e8c-45f4-bb47-116700852889	Computer Science	Programming and technology books	2025-04-25 11:19:14.626	2025-04-25 11:19:14.626
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Review" (id, "bookId", "userEmail", "userName", rating, comment, "createdAt", "updatedAt") FROM stdin;
4e2dfbc9-361e-4f83-9b20-d51cbe42458c	f6f36ae2-34bf-4fad-af67-0457fab71c22	john@example.com	John Doe	5	Amazing book! I loved the story and characters.	2025-04-25 11:19:14.671	2025-04-25 11:19:14.671
6b87dd8f-040e-4747-9677-52be9ec6cbfb	a37c6718-b763-42df-9b58-fa3e266e1dc4	jane@example.com	Jane Smith	4	A profound and thought-provoking novel that remains relevant today.	2025-04-25 11:19:14.673	2025-04-25 11:19:14.673
29f6df00-b2f9-4a6d-afca-4d26eb4a5060	27e54a53-bfda-4efa-9096-178756be74ab	john@example.com	John Doe	5	Explains complex scientific concepts in an accessible way.	2025-04-25 11:19:14.675	2025-04-25 11:19:14.675
8fd8a8b0-a6ba-4666-a9f0-9f8fc28a1fed	6b13e4b7-0cd7-4317-8e77-dc1a2ae445b2	librarian@libroware.com	Library Staff	5	Essential reading for any software developer.	2025-04-25 11:19:14.676	2025-04-25 11:19:14.676
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt", "profilePicture", "requiresPasswordChange") FROM stdin;
36758b31-ec24-451e-bf56-42cdd62edaa0	librarian@libroware.com	$2a$10$Ram/aucSN5nrHKRqXCUyI.NqKmrIUfJwyl5hZ5ZJJGb4hiYH1GeJi	Library	Staff	LIBRARIAN	2025-04-25 11:19:14.611	2025-04-25 11:19:14.611	\N	t
d3029cd3-3595-4cd8-9d5c-8bbb4070af74	john@example.com	$2a$10$Ram/aucSN5nrHKRqXCUyI.NqKmrIUfJwyl5hZ5ZJJGb4hiYH1GeJi	John	Doe	USER	2025-04-25 11:19:14.613	2025-04-25 11:19:14.613	\N	t
a27f18cc-11ce-4705-a146-6307ecabd55f	jane@example.com	$2a$10$Ram/aucSN5nrHKRqXCUyI.NqKmrIUfJwyl5hZ5ZJJGb4hiYH1GeJi	Jane	Smith	USER	2025-04-25 11:19:14.614	2025-04-25 11:19:14.614	\N	t
765f5887-b7b0-43ab-809b-a7d439fd473a	admin@libroware.com	$2a$10$R2CITIjEzaXJ6y2.tBNPDegI/oFKvUj55khNiFArEJSot2Qje1gTq	Admin	User	ADMIN	2025-04-25 11:19:14.609	2025-04-25 11:20:41.559	\N	f
157781e0-f125-4a88-a6a6-cc41d2af0ed3	test@test.admin	$2a$10$H1nDRdLNP6ALE42zpXLr8ObyIbkmrTnkwRL.v5OkGmqKdjAkum3SO	test	test	ADMIN	2025-04-25 11:25:05.747	2025-04-25 11:25:05.747		f
5a5a490c-239d-4fe0-9def-a849266abde5	ella@ella.cm	$2a$10$QSttpKUxg5IRzE0QnE13fOcmasTEC4ov8LwdXmq8nNLzN8WgbktOO	ella	ella	ADMIN	2025-04-25 11:57:33.765	2025-04-25 11:57:33.765		f
611ce27b-54e9-4c2d-9184-06a35c894e59	admin1@libroware.com	$2a$10$FOQJOc/FYN4c3h4ZTDmbfepdf.H15uOGxKMtUkomj.SjUG8oZnyPq	Alex	Johnson	ADMIN	2025-04-25 12:25:41.259	2025-04-25 12:25:41.259	\N	f
72e99fc0-e241-4dac-ad14-51cee923576e	admin2@libroware.com	$2a$10$ZeVH9CYDiVzx6AzWtP7nPesssxtUHqpyNbqXWHuF.s5ZIHK/mf2KO	Sarah	Williams	ADMIN	2025-04-25 12:25:41.345	2025-04-25 12:25:41.345	\N	f
3d37dc10-5434-49a7-94a9-9cb5768f3fa8	admin3@libroware.com	$2a$10$4wUVGMzByJ2RcyuvAfn.1.Twr62LrMboJmtscMslXXbtfHK5eyQWG	Michael	Rodriguez	ADMIN	2025-04-25 12:25:41.43	2025-04-25 12:25:41.43	\N	f
d305dfd2-53ee-4ca3-9137-3fe6f2034a20	emma@ndj.cm	$2a$10$aMJk1uO8bmPLo4dcWT7R7OsrM7bFaIyVcqJaoDaiSUiEJf01s9I6a	Emma	Njesse Let	USER	2025-04-27 04:09:44.342	2025-04-27 23:37:02.144		f
\.


--
-- Data for Name: _BookToAuthor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_BookToAuthor" ("A", "B") FROM stdin;
6fb8ec6c-3b89-4a8b-b969-d004c8deaddc	f6f36ae2-34bf-4fad-af67-0457fab71c22
f54628ce-e7cd-41f3-bd92-3afcef5d90b5	a37c6718-b763-42df-9b58-fa3e266e1dc4
b2b76372-4955-4ca1-9699-be52089971c6	27e54a53-bfda-4efa-9096-178756be74ab
0ae5fd4d-8032-446c-983e-2a8f5d7cc49d	6b13e4b7-0cd7-4317-8e77-dc1a2ae445b2
\.


--
-- Data for Name: _BookToCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_BookToCategory" ("A", "B") FROM stdin;
f6f36ae2-34bf-4fad-af67-0457fab71c22	077afedf-b2c7-43ae-b6a3-2d698680080d
a37c6718-b763-42df-9b58-fa3e266e1dc4	077afedf-b2c7-43ae-b6a3-2d698680080d
a37c6718-b763-42df-9b58-fa3e266e1dc4	21844fb7-bdd2-4e0d-8605-d81c92c40c8f
27e54a53-bfda-4efa-9096-178756be74ab	88170501-c3b5-4eca-bb00-85796b085136
6b13e4b7-0cd7-4317-8e77-dc1a2ae445b2	bf06ce9c-2e8c-45f4-bb47-116700852889
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
61515dbb-eab7-4dbd-8d40-adf15f51eb95	7054e33a39cf33d5a1bb2e8680a72ed46afcb2668c013788957513e783045c27	2025-04-23 15:51:29.200063+01	20250414190841_init	\N	\N	2025-04-23 15:51:28.984461+01	1
b5f45817-9d64-455b-95c2-5cc42d19a034	95937425867eabaf30aab3af6e826fd34ad72d3434cab63a65a66c1d40817ba5	2025-04-23 15:51:29.323657+01	20250418213416_add_requires_password_change	\N	\N	2025-04-23 15:51:29.232297+01	1
\.


--
-- Name: Author Author_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Author"
    ADD CONSTRAINT "Author_pkey" PRIMARY KEY (id);


--
-- Name: Book Book_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Book"
    ADD CONSTRAINT "Book_pkey" PRIMARY KEY (id);


--
-- Name: Borrow Borrow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Borrow"
    ADD CONSTRAINT "Borrow_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _BookToAuthor _BookToAuthor_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BookToAuthor"
    ADD CONSTRAINT "_BookToAuthor_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _BookToCategory _BookToCategory_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BookToCategory"
    ADD CONSTRAINT "_BookToCategory_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Book_isbn_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Book_isbn_key" ON public."Book" USING btree (isbn);


--
-- Name: Borrow_bookId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Borrow_bookId_idx" ON public."Borrow" USING btree ("bookId");


--
-- Name: Borrow_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Borrow_userId_idx" ON public."Borrow" USING btree ("userId");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Review_bookId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_bookId_idx" ON public."Review" USING btree ("bookId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _BookToAuthor_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_BookToAuthor_B_index" ON public."_BookToAuthor" USING btree ("B");


--
-- Name: _BookToCategory_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_BookToCategory_B_index" ON public."_BookToCategory" USING btree ("B");


--
-- Name: Borrow Borrow_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Borrow"
    ADD CONSTRAINT "Borrow_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public."Book"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Borrow Borrow_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Borrow"
    ADD CONSTRAINT "Borrow_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public."Book"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _BookToAuthor _BookToAuthor_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BookToAuthor"
    ADD CONSTRAINT "_BookToAuthor_A_fkey" FOREIGN KEY ("A") REFERENCES public."Author"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _BookToAuthor _BookToAuthor_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BookToAuthor"
    ADD CONSTRAINT "_BookToAuthor_B_fkey" FOREIGN KEY ("B") REFERENCES public."Book"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _BookToCategory _BookToCategory_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BookToCategory"
    ADD CONSTRAINT "_BookToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES public."Book"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _BookToCategory _BookToCategory_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BookToCategory"
    ADD CONSTRAINT "_BookToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

